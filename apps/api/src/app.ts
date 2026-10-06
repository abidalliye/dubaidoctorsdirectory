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
  Res,
  ServiceUnavailableException,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import Redis from "ioredis";
import Typesense from "typesense";
import { columns, db } from "./db";
import { AccountsModule } from "./accounts";
import { CareModule } from "./care";
import { SafeErrors } from "./errors";
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
    if (
      query.kind &&
      ![
        "doctor",
        "clinic",
        "hospital",
        "lab",
        "surgeon",
        "technician",
      ].includes(query.kind)
    )
      throw new BadRequestException("Invalid provider type");
    if ((query.q?.length || 0) > 200 || (query.area?.length || 0) > 100)
      throw new BadRequestException("Search too long");
    if((query.insurance?.length||0)>150||(query.specialty?.length||0)>150||query.sort&&!['name','newest','fee'].includes(query.sort)||query.verified&&!['true','false'].includes(query.verified))throw new BadRequestException('Invalid search filter');
    const values: unknown[] = [];
    const conditions = [`published = true`, `NOT archived`];
    const add = (value: unknown, sql: string) => {
      values.push(value);
      conditions.push(sql.replaceAll("?", `$${values.length}`));
    };
    if (query.q)
      add(query.q, `search_vector @@ websearch_to_tsquery('english', ?)`);
    if (query.kind) add(query.kind, "kind = ?");
    if (query.area) add(`%${query.area}%`, "area ILIKE ?");
    if(query.insurance)add(`%${query.insurance}%`,"COALESCE(details->>'insurance','') ILIKE ?");
    if(query.specialty)add(`%${query.specialty}%`,"specialty ILIKE ?");
    if(query.verified)add(query.verified==='true','verified = ?');
    if (query.mode) {
      if (!['In clinic','Home visit'].includes(query.mode)) throw new BadRequestException('Invalid consultation mode');
      add(query.mode, "EXISTS(SELECT 1 FROM care_services s WHERE s.provider_id=providers.id AND s.active AND s.mode=?)");
    }
    if (query.maxFee) {
      const fee = Number(query.maxFee);
      if (!Number.isFinite(fee) || fee < 0 || fee > 100000) throw new BadRequestException('Invalid maximum fee');
      add(Math.round(fee*100), 'EXISTS(SELECT 1 FROM care_services s WHERE s.provider_id=providers.id AND s.active AND s.price_minor<=?)');
    }
    if (query.available) {
      if (query.available !== 'true') throw new BadRequestException('Invalid availability filter');
      conditions.push("EXISTS(SELECT 1 FROM care_slots t JOIN care_services s ON s.id=t.service_id WHERE s.provider_id=providers.id AND s.active AND t.active AND t.starts_at>now() AND NOT EXISTS(SELECT 1 FROM care_appointments a WHERE a.slot_id=t.id AND a.status IN ('Requested','Confirmed','Completed')))");
    }
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
    const key = `directory:v1:${JSON.stringify({ conditions, values, page, limit, sort: query.sort || "name" })}`;
    const liveServices=!!(query.available||query.mode||query.maxFee||query.sort==='fee');
    try {
      const hit = liveServices ? null : await this.cache?.get(key);
      if (hit) return JSON.parse(hit);
    } catch {}
    if (
      this.searchClient &&
      query.q &&
      !query.area &&
      !query.insurance && !query.specialty && !query.sort && !query.verified &&
      !query.mode && !query.maxFee && !query.available &&
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
            `SELECT ${columns} FROM providers WHERE published=true AND NOT archived AND id=ANY($1::text[]) ORDER BY array_position($1::text[],id)`,
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
        `SELECT ${columns} FROM providers WHERE ${where} ORDER BY ${query.sort==='newest'?'created_at DESC':query.sort==='fee'?"(SELECT min(price_minor) FROM care_services s WHERE s.provider_id=providers.id AND s.active) NULLS LAST":'name'},id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, (page - 1) * limit],
      );
      const result = {
        items: rows.rows,
        total: count.rows[0].total,
        page,
        limit,
      };
      try {
        if(!liveServices)await this.cache?.set(key, JSON.stringify(result), "EX", 60);
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
        `SELECT ${columns},COALESCE((SELECT jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'slug',f.slug)) FROM provider_affiliations a JOIN providers f ON f.id=a.facility_id WHERE a.provider_id=providers.id AND f.published AND NOT f.archived),'[]') AS affiliations FROM providers WHERE slug=$1 AND published=true AND NOT archived`,
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
@Controller("content")
class ContentController {
  @Get('articles/:id/image') async articleImage(@Param('id') id:string,@Res() response:any) {
    if(!/^[a-f0-9-]{36}$/.test(id))throw new NotFoundException();
    const result=await db.query(`SELECT f.content,f.content_type FROM dashboard_articles a JOIN account_files f ON f.id::text=a.data->>'imageId' WHERE a.id=$1 AND NOT a.archived AND a.data->>'status'='Published' AND f.content_type IN ('image/png','image/jpeg') AND NOT EXISTS(SELECT 1 FROM care_records r WHERE r.file_id=f.id)`,[id]);
    if(!result.rows[0])throw new NotFoundException();
    response.setHeader('Content-Type',result.rows[0].content_type);
    response.setHeader('Cache-Control','no-store');
    response.send(result.rows[0].content);
  }
  @Get(":kind") async content(
    @Param("kind") kind: string,
    @Query("slug") slug?: string,
  ) {
    if (!["pages", "banners", "faqs", "articles"].includes(kind))
      throw new NotFoundException();
    const result = await db.query(
      `SELECT id,data,updated_at FROM dashboard_${kind} WHERE NOT archived AND data->>'status'='Published' AND ($1::text IS NULL OR data->>'slug'=$1) ORDER BY updated_at DESC LIMIT 100`,
      [slug || null],
    );
    return { items: result.rows };
  }
}
@Module({
  imports: [AccountsModule, CareModule],
  controllers: [DirectoryController, HealthController, ContentController],
  providers: [Providers],
})
class AppModule {}
export async function createApplication() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(require("express").json({ limit: "2mb" }));
  app.use(helmet());
  app.useGlobalFilters(new SafeErrors());
  app.use((request: any, response: any, next: () => void) => {
    if (/^\/v1\/(auth|account|admin|dashboard)(\/|$)/.test(request.path) || /^\/v1\/care(?!\/public(?:\/|$))(\/|$)/.test(request.path))
      response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.setGlobalPrefix("v1");
  app.enableCors({ origin: process.env.WEB_ORIGIN || "http://localhost:3000" });
  return app;
}
