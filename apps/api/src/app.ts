import "reflect-metadata";
import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Query,
  ServiceUnavailableException,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import Redis from "ioredis";
import Typesense from "typesense";
import { columns, db } from "./db";
@Injectable()
class Providers implements OnModuleDestroy {
  private searchClient = process.env.TYPESENSE_API_KEY
    ? new Typesense.Client({
        nodes: [
          {
            host: process.env.TYPESENSE_HOST || "localhost",
            port: Number(process.env.TYPESENSE_PORT || 8108),
            protocol: process.env.TYPESENSE_PROTOCOL || "http",
          },
        ],
        apiKey: process.env.TYPESENSE_API_KEY,
        connectionTimeoutSeconds: 2,
        numRetries: 0,
      })
    : null;
  private cache = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      })
    : null;
  constructor() {
    this.cache?.on("error", () => {});
    this.cache?.connect().catch(() => {});
  }
  async onModuleDestroy() {
    this.cache?.disconnect();
    await db.end();
  }
  async search(query: Record<string, string>) {
    if (Object.values(query).some((value) => typeof value !== "string"))
      throw new BadRequestException("Query values must be strings");
    const page = Number(query.page || 1),
      limit = Number(query.limit || 12);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10000 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    )
      throw new BadRequestException("Invalid pagination");
    if (query.kind && !["doctor", "clinic"].includes(query.kind))
      throw new BadRequestException("Invalid provider type");
    if ((query.q?.length || 0) > 200 || (query.area?.length || 0) > 100)
      throw new BadRequestException("Search too long");
    const values: unknown[] = [];
    const conditions = [`published = true`];
    const add = (value: unknown, sql: string) => {
      values.push(value);
      conditions.push(sql.replaceAll("?", `$${values.length}`));
    };
    if (query.q)
      add(query.q, `search_vector @@ websearch_to_tsquery('english', ?)`);
    if (query.kind) add(query.kind, "kind = ?");
    if (query.area) add(`%${query.area}%`, "area ILIKE ?");
    if (
      query.lat !== undefined ||
      query.lng !== undefined ||
      query.radius !== undefined
    ) {
      const lat = Number(query.lat),
        lng = Number(query.lng),
        radius = Number(query.radius || 10);
      if (
        !query.lat ||
        !query.lng ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180 ||
        !Number.isFinite(radius) ||
        radius <= 0 ||
        radius > 100
      )
        throw new BadRequestException("Invalid geo coordinates or radius");
      values.push(lng, lat, radius * 1000);
      conditions.push(
        `ST_DWithin(location, ST_SetSRID(ST_MakePoint($${values.length - 2},$${values.length - 1}),4326)::geography,$${values.length})`,
      );
    }
    const key = `directory:v1:${JSON.stringify({ conditions, values, page, limit })}`;
    try {
      const hit = await this.cache?.get(key);
      if (hit) return JSON.parse(hit);
    } catch {}
    if (
      this.searchClient &&
      query.q &&
      !query.area &&
      query.lat === undefined &&
      query.lng === undefined
    ) {
      try {
        const matches = await this.searchClient
          .collections<{ id: string }>("providers")
          .documents()
          .search({
            q: query.q,
            query_by: "name,specialty,services,area",
            filter_by: query.kind ? `kind:=${query.kind}` : undefined,
            page,
            per_page: limit,
          });
        const ids = (matches.hits || []).map((hit) => hit.document.id);
        if (matches.found > 0) {
          const rows = await db.query(
            `SELECT ${columns} FROM providers WHERE published=true AND id=ANY($1::text[]) ORDER BY array_position($1::text[],id)`,
            [ids],
          );
          if (rows.rows.length === ids.length) {
            const result = {
              items: rows.rows,
              total: matches.found,
              page,
              limit,
            };
            try {
              await this.cache?.set(key, JSON.stringify(result), "EX", 60);
            } catch {}
            return result;
          }
        }
      } catch {}
    }
    try {
      const where = conditions.join(" AND ");
      const count = await db.query(
        `SELECT count(*)::int AS total FROM providers WHERE ${where}`,
        values,
      );
      const rows = await db.query(
        `SELECT ${columns} FROM providers WHERE ${where} ORDER BY name,id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, (page - 1) * limit],
      );
      const result = {
        items: rows.rows,
        total: count.rows[0].total,
        page,
        limit,
      };
      try {
        await this.cache?.set(key, JSON.stringify(result), "EX", 60);
      } catch {}
      return result;
    } catch {
      throw new ServiceUnavailableException(
        "Directory temporarily unavailable",
      );
    }
  }
  async detail(slug: string) {
    try {
      const result = await db.query(
        `SELECT ${columns} FROM providers WHERE slug=$1 AND published=true`,
        [slug],
      );
      if (!result.rows[0]) throw new NotFoundException();
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException();
    }
  }
}
@Controller("providers")
class DirectoryController {
  constructor(@Inject(Providers) private readonly providers: Providers) {}
  @Get() search(@Query() query: Record<string, string>) {
    return this.providers.search(query);
  }
  @Get(":slug") detail(@Param("slug") slug: string) {
    return this.providers.detail(slug);
  }
}
@Controller("health")
class HealthController {
  @Get() async health() {
    try {
      await db.query("SELECT 1");
      return { status: "ok" };
    } catch (error) {
      const code = (error as { code?: string }).code || "UNKNOWN";
      Logger.error(`Database health query failed (${code})`, "DatabaseHealth");
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
@Module({
  controllers: [DirectoryController, HealthController],
  providers: [Providers],
})
class AppModule {}
export async function createApplication() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix("v1");
  app.enableCors({ origin: process.env.WEB_ORIGIN || "http://localhost:3000" });
  return app;
}
