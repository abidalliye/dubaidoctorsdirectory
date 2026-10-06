import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AccountsModule, SessionGuard } from "./accounts";
import { db, columns } from "./db";
import { bodyObject, field } from "./security";

export function careInput(input: unknown, keys: string[]) {
  const b = bodyObject(input);
  if (Object.keys(b).some((k) => !keys.includes(k)))
    throw new BadRequestException("Unknown field");
  return b;
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new BadRequestException("Invalid record");
  return value;
}
export function money(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,7}(\.\d{1,2})?$/.test(value))
    throw new BadRequestException("Invalid price");
  return Math.round(Number(value) * 100);
}
export const transitions: Record<string, string[]> = {
  Requested: ["Confirmed", "Cancelled", "Rejected"],
  Confirmed: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
  Rejected: [],
};
export function transition(current: string, next: string, patient: boolean) {
  if (
    !transitions[current]?.includes(next) ||
    (patient && next !== "Cancelled")
  )
    throw new ConflictException("This appointment action is not available");
}
const managed = `($2::boolean OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1))`;
const managedWrite = `($2::boolean OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1 AND m.permission IN ('owner','manager')))`;
async function providerAccess(user: any, id: string, client: any = db) {
  const result = await client.query(
    `SELECT p.* FROM providers p WHERE p.id=$3 AND NOT p.archived AND ${managedWrite}`,
    [user.id, user.role === "admin", field(id, 150, true)],
  );
  if (!result.rows[0]) throw new NotFoundException("Provider not found");
  return result.rows[0];
}
async function providerOwner(user: any, id: string) {
  const p = await db.query(
    `SELECT p.* FROM providers p WHERE p.id=$3 AND NOT p.archived AND ($2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1 AND m.permission IN ('owner','manager')))`,
    [user.id, user.role === "admin", field(id, 150, true)],
  );
  if (!p.rows[0])
    throw new NotFoundException("Business management access required");
  return p.rows[0];
}
async function businessDetails(id: string, privateData = false) {
  const [hours, licenses, branches, media, professionals] = await Promise.all([
    db.query(
      "SELECT id,weekday,opens,closes FROM care_provider_hours WHERE provider_id=$1 ORDER BY weekday,opens",
      [id],
    ),
    db.query(
      `SELECT id,authority,license_number,expires_on,qualification${privateData ? ",proof_file_id" : ""} FROM care_licenses WHERE provider_id=$1`,
      [id],
    ),
    db.query("SELECT * FROM care_branches WHERE provider_id=$1 ORDER BY name", [
      id,
    ]),
    db.query(
      "SELECT id,caption,content_type FROM care_media WHERE provider_id=$1 ORDER BY created_at DESC",
      [id],
    ),
    db.query(`SELECT ${columns} FROM providers WHERE published AND NOT archived AND id IN (SELECT provider_id FROM provider_affiliations WHERE facility_id=$1) ORDER BY name`,[id]),
  ]);
  return {
    hours: hours.rows,
    licenses: licenses.rows,
    branches: branches.rows,
    media: media.rows,
    professionals: professionals.rows,
  };
}
async function appointmentAccess(
  user: any,
  id: string,
  client: any = db,
  lock = false,
) {
  const r = await client.query(
    `SELECT a.*,a.patient_id=$2 AS is_patient FROM care_appointments a WHERE a.id=$1 AND (a.patient_id=$2 OR $3 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=a.provider_id AND m.user_id=$2)) ${lock ? "FOR UPDATE" : ""}`,
    [uuid(id), user.id, user.role === "admin"],
  );
  if (!r.rows[0]) throw new NotFoundException("Appointment not found");
  return r.rows[0];
}
async function notify(client: any, a: any, title: string) {
  await client.query(
    `INSERT INTO care_notifications(id,recipient_id,title,appointment_id) SELECT gen_random_uuid(),recipient,$2,$3 FROM (SELECT $1::uuid recipient UNION SELECT user_id FROM provider_memberships WHERE provider_id=$4) recipients`,
    [a.patient_id, title, a.id, a.provider_id],
  );
}
@Controller("care/public")
class PublicCareController {
  @Get("provider-summaries") async providerSummaries(@Query("ids") raw = "") {
    if (typeof raw !== "string" || raw.length > 7600) throw new BadRequestException("Invalid provider selection");
    const ids = [...new Set(raw.split(",").filter(Boolean))];
    if (ids.length > 50 || ids.some(id => id.length > 150)) throw new BadRequestException("Select up to 50 providers");
    return { items: (await db.query(`SELECT p.id,
      (SELECT min(s.price_minor) FROM care_services s WHERE s.provider_id=p.id AND s.active) AS price_minor,
      (SELECT jsonb_agg(DISTINCT s.mode) FROM care_services s WHERE s.provider_id=p.id AND s.active) AS modes,
      (SELECT min(t.starts_at) FROM care_slots t JOIN care_services s ON s.id=t.service_id WHERE s.provider_id=p.id AND s.active AND t.active AND t.starts_at>now() AND NOT EXISTS(SELECT 1 FROM care_appointments a WHERE a.slot_id=t.id AND a.status IN ('Requested','Confirmed','Completed'))) AS next_slot,
      (SELECT round(avg(r.rating),1)::float FROM care_reviews r WHERE r.provider_id=p.id AND r.status='Published') AS rating,
      (SELECT count(*)::int FROM care_reviews r WHERE r.provider_id=p.id AND r.status='Published') AS review_count
      FROM providers p WHERE p.id=ANY($1::text[]) AND p.published AND NOT p.archived`, [ids])).rows };
  }
  @Get("business/:id") async business(@Param("id") id: string) {
    if (
      !(
        await db.query(
          "SELECT id FROM providers WHERE id=$1 AND published AND NOT archived",
          [field(id, 150, true)],
        )
      ).rows[0]
    )
      throw new NotFoundException();
    return businessDetails(id);
  }
  @Get("media/:id") async publicMedia(
    @Param("id") id: string,
    @Res() res: any,
  ) {
    const r = (
      await db.query(
        "SELECT m.content,m.content_type FROM care_media m JOIN providers p ON p.id=m.provider_id WHERE m.id=$1 AND p.published AND NOT p.archived",
        [uuid(id)],
      )
    ).rows[0];
    if (!r) throw new NotFoundException();
    res.setHeader("Content-Type", r.content_type);
    res.setHeader("Cache-Control", "public,max-age=300");
    res.send(r.content);
  }
  @Get("config") async config() {
    const r = await db.query("SELECT data FROM site_settings WHERE id='site'");
    const d = r.rows[0]?.data || {};
    return {
      siteName: d.siteName || "CareAtlas",
      supportEmail: d.supportEmail || "",
      supportPhone: d.supportPhone || "",
      bookingPolicy: d.bookingPolicy || "",
    };
  }
  @Get("services") async services(
    @Query("provider") provider = "",
    @Query("q") q = "",
  ) {
    return {
      items: (
        await db.query(
          `SELECT s.*,p.name provider_name,p.slug,p.area,p.kind FROM care_services s JOIN providers p ON p.id=s.provider_id WHERE s.active AND p.published AND NOT p.archived AND ($1='' OR p.id=$1) AND (s.name ILIKE $2 OR p.name ILIKE $2) ORDER BY s.name LIMIT 100`,
          [field(provider, 150), `%${field(q, 100)}%`],
        )
      ).rows,
    };
  }
  @Get("slots/:service") async slots(@Param("service") service: string) {
    return {
      items: (
        await db.query(
          `SELECT t.* FROM care_slots t JOIN care_services s ON s.id=t.service_id JOIN providers p ON p.id=s.provider_id WHERE t.service_id=$1 AND t.active AND s.active AND p.published AND NOT p.archived AND t.starts_at>now() AND NOT EXISTS(SELECT 1 FROM care_appointments a WHERE a.slot_id=t.id AND a.status IN ('Requested','Confirmed','Completed')) ORDER BY t.starts_at LIMIT 100`,
          [uuid(service)],
        )
      ).rows,
    };
  }
  @Get("taxonomy") async taxonomy(@Query('kind') kind = '') {
    if (typeof kind !== 'string' || kind && !['doctor','surgeon','clinic','hospital','lab','technician'].includes(kind)) throw new BadRequestException('Invalid provider type');
    return {
      specialties: (
        await db.query(
          `SELECT specialty name,count(*)::int count FROM providers WHERE published AND NOT archived AND specialty<>'' AND ($1='' OR kind=$1) GROUP BY specialty ORDER BY specialty`, [kind],
        )
      ).rows,
      locations: (
        await db.query(
          `SELECT area name,count(*)::int count FROM providers WHERE published AND NOT archived AND area<>'' AND ($1='' OR kind=$1) GROUP BY area ORDER BY area`, [kind],
        )
      ).rows,
    };
  }
  @Get("reviews/:provider") async reviews(@Param("provider") id: string) {
    return {
      items: (
        await db.query(
          `SELECT r.id,r.rating,r.comment,r.created_at,u.name patient_name FROM care_reviews r JOIN app_users u ON u.id=r.patient_id JOIN providers p ON p.id=r.provider_id WHERE r.provider_id=$1 AND r.status='Published' AND p.published AND NOT p.archived ORDER BY r.created_at DESC LIMIT 50`,
          [field(id, 150, true)],
        )
      ).rows,
    };
  }
}
@Controller("care")
@UseGuards(SessionGuard)
class CareController {
  @Get('dashboard-metrics') async dashboardMetrics(@Req() req:any,@Query('from') from='',@Query('to') to='') {
    for(const date of [from,to])if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw new BadRequestException('Invalid date');
    if(from&&to&&from>to)throw new BadRequestException('Invalid date range');
    const args=[req.account.id,req.account.role==='admin',from||null,to||null];
    const scope="(a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=a.provider_id AND m.user_id=$1))";
    const dateScope="($3::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date >= $3) AND ($4::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date <= $4)";
    const paymentDates="($3::date IS NULL OR (i.paid_at AT TIME ZONE 'Asia/Dubai')::date >= $3) AND ($4::date IS NULL OR (i.paid_at AT TIME ZONE 'Asia/Dubai')::date <= $4)";
    const [people,records,revenue,services,reviews]=await Promise.all([
      db.query(`SELECT count(*) FILTER(WHERE a.status IN ('Requested','Confirmed') AND t.starts_at>now())::int upcoming,count(DISTINCT a.patient_id) FILTER(WHERE a.status NOT IN ('Cancelled','Rejected'))::int patients,count(DISTINCT a.provider_id) FILTER(WHERE a.status NOT IN ('Cancelled','Rejected'))::int providers FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE ${scope} AND ${dateScope}`,args),
      db.query(`SELECT r.kind,count(*)::int count FROM care_records r JOIN care_appointments a ON a.id=r.appointment_id JOIN care_slots t ON t.id=a.slot_id WHERE r.status='Released' AND (a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.user_id=$1 AND m.provider_id IN (a.provider_id,r.lab_provider_id) AND m.permission IN ('owner','doctor','technician'))) AND ${dateScope} GROUP BY r.kind`,args),
      db.query(`SELECT (i.paid_at AT TIME ZONE 'Asia/Dubai')::date::text date,sum(i.amount_minor)::float amount FROM care_invoices i JOIN care_appointments a ON a.id=i.appointment_id WHERE i.status='Paid' AND ${scope} AND ${paymentDates} GROUP BY 1 ORDER BY 1`,args),
      db.query(`SELECT s.name,count(*)::int count FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id JOIN care_services s ON s.id=a.service_id WHERE ${scope} AND ${dateScope} AND a.status NOT IN ('Cancelled','Rejected') GROUP BY s.name ORDER BY count(*) DESC,s.name LIMIT 8`,args),
      db.query(`SELECT round(avg(r.rating),1)::float rating,count(*)::int count FROM care_reviews r JOIN care_appointments a ON a.id=r.appointment_id JOIN care_slots t ON t.id=a.slot_id WHERE r.status='Published' AND ${scope} AND ${dateScope}`,args),
    ]);
    return {people:people.rows[0],records:records.rows,revenue:revenue.rows,services:services.rows,reviews:reviews.rows[0]};
  }
  @Get('admin-insights') async adminInsights(@Req() req:any,@Query('from') from='',@Query('to') to='') {
    if(req.account.role!=='admin') throw new ForbiddenException();
    for(const d of [from,to]) if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)) throw new BadRequestException('Invalid date range');
    if(from&&to&&from>to) throw new BadRequestException('Invalid date range');
    const args=[from||null,to||null];
    const appointmentDates=`($1::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date >= $1) AND ($2::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date <= $2)`;
    const paymentDates=`($1::date IS NULL OR (i.paid_at AT TIME ZONE 'Asia/Dubai')::date >= $1) AND ($2::date IS NULL OR (i.paid_at AT TIME ZONE 'Asia/Dubai')::date <= $2)`;
    const [bookingTrend,revenueTrend,posts,doctors,locations,recentPosts,payments]=await Promise.all([
      db.query(`SELECT (t.starts_at AT TIME ZONE 'Asia/Dubai')::date::text date,a.status,count(*)::int count FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE ${appointmentDates} GROUP BY 1,2 ORDER BY 1`,args),
      db.query(`SELECT (i.paid_at AT TIME ZONE 'Asia/Dubai')::date::text date,sum(i.amount_minor)::bigint amount FROM care_invoices i WHERE i.status='Paid' AND ${paymentDates} GROUP BY 1 ORDER BY 1`,args),
      db.query(`SELECT data->>'status' status,count(*)::int count FROM dashboard_articles WHERE NOT archived GROUP BY 1`),
      db.query(`SELECT p.id,p.name,p.specialty,count(*)::int count FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id JOIN providers p ON p.id=a.provider_id WHERE p.kind IN ('doctor','surgeon') AND a.status NOT IN ('Cancelled','Rejected') AND ${appointmentDates} GROUP BY p.id ORDER BY count DESC,p.name LIMIT 5`,args),
      db.query(`SELECT area name,count(*)::int count FROM providers WHERE NOT archived AND area<>'' GROUP BY area ORDER BY count DESC,area LIMIT 5`),
      db.query(`SELECT id,data,created_at FROM dashboard_articles WHERE NOT archived ORDER BY created_at DESC LIMIT 5`),
      db.query(`SELECT i.id,i.amount_minor,i.payment_method,i.status,i.paid_at FROM care_invoices i WHERE i.status='Paid' AND ${paymentDates} ORDER BY i.paid_at DESC LIMIT 5`,args),
    ]);
    return {bookingTrend:bookingTrend.rows,revenueTrend:revenueTrend.rows.map(r=>({...r,amount:Number(r.amount)})),posts:posts.rows,doctors:doctors.rows,locations:locations.rows,recentPosts:recentPosts.rows,payments:payments.rows};
  }
  @Get('overview') async overview(@Req() req:any,@Query('from') from='',@Query('to') to=''){
    for(const d of [from,to])if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d))throw new BadRequestException('Invalid date range');if(from&&to&&from>to)throw new BadRequestException('Invalid date range');
    const scope=`(a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=a.provider_id AND m.user_id=$1))`;
    const dates=`($3::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date>=$3) AND ($4::date IS NULL OR (t.starts_at AT TIME ZONE 'Asia/Dubai')::date<=$4)`;const args=[req.account.id,req.account.role==='admin',from||null,to||null];
    const [bookings,paid,listingKinds,trend,favorites,reports]=await Promise.all([db.query(`SELECT a.status,count(*)::int count FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE ${scope} AND ${dates} GROUP BY a.status`,args),db.query(`SELECT COALESCE(sum(i.amount_minor),0)::bigint amount FROM care_invoices i JOIN care_appointments a ON a.id=i.appointment_id JOIN care_slots t ON t.id=a.slot_id WHERE i.status='Paid' AND ${scope} AND ${dates}`,args),db.query(`SELECT p.kind,count(*)::int count FROM providers p WHERE NOT p.archived AND ${managed} GROUP BY p.kind`,args.slice(0,2)),db.query(`SELECT (t.starts_at AT TIME ZONE 'Asia/Dubai')::date::text date,count(*)::int count FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE ${scope} AND ${dates} GROUP BY 1 ORDER BY 1`,args),db.query('SELECT count(*)::int count FROM care_favorites WHERE user_id=$1',[req.account.id]),db.query(`SELECT count(*)::int count FROM care_records r JOIN care_appointments a ON a.id=r.appointment_id WHERE r.kind='report' AND r.status='Released' AND (a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.user_id=$1 AND m.provider_id IN (a.provider_id,r.lab_provider_id) AND m.permission IN ('owner','doctor','technician')))`,args.slice(0,2))]);return {bookings:bookings.rows,paidMinor:Number(paid.rows[0].amount),listingKinds:listingKinds.rows,trend:trend.rows,favorites:favorites.rows[0].count,reports:reports.rows[0].count};
  }
  @Get("providers/:id/details") async ownDetails(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    return businessDetails(id, true);
  }
  @Post("providers/:id/hours") async hours(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const b = careInput(input, ["weekday", "opens", "closes"]);
    const day = Number(b.weekday);
    if (
      !Number.isInteger(day) ||
      day < 0 ||
      day > 6 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.opens) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.closes) ||
      b.opens >= b.closes
    )
      throw new BadRequestException("Choose a valid day and opening interval");
    try {
      return {
        record: (
          await db.query(
            "INSERT INTO care_provider_hours(id,provider_id,weekday,opens,closes) VALUES($1,$2,$3,$4,$5) RETURNING *",
            [randomUUID(), id, day, b.opens, b.closes],
          )
        ).rows[0],
      };
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException("Opening interval already exists");
      throw e;
    }
  }
  @Post("providers/:id/licenses") async license(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const b = careInput(input, [
      "authority",
      "licenseNumber",
      "expiresOn",
      "qualification",
      "proofFileId",
    ]);
    const date = b.expiresOn ? field(b.expiresOn, 10) : null;
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)
    )
      throw new BadRequestException("Invalid expiry date");
    if (
      b.proofFileId &&
      !(
        await db.query(
          "SELECT id FROM account_files WHERE id=$1 AND owner_id=$2",
          [uuid(b.proofFileId), req.account.id],
        )
      ).rows[0]
    )
      throw new NotFoundException("Proof file not found");
    return {
      record: (
        await db.query(
          "INSERT INTO care_licenses(id,provider_id,authority,license_number,expires_on,qualification,proof_file_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
          [
            randomUUID(),
            id,
            field(b.authority, 100, true),
            field(b.licenseNumber, 100, true),
            date,
            field(b.qualification || "", 2000),
            b.proofFileId || null,
          ],
        )
      ).rows[0],
    };
  }
  @Post("providers/:id/branches") async branch(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const b = careInput(input, [
      "name",
      "country",
      "city",
      "address",
      "latitude",
      "longitude",
      "phone",
    ]);
    let lat = null,
      lng = null;
    if (b.latitude || b.longitude) {
      lat = Number(b.latitude);
      lng = Number(b.longitude);
      if (
        !b.latitude ||
        !b.longitude ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      )
        throw new BadRequestException("Enter valid coordinates");
    }
    return {
      record: (
        await db.query(
          "INSERT INTO care_branches(id,provider_id,name,country,city,address,latitude,longitude,phone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            randomUUID(),
            id,
            field(b.name, 150, true),
            field(b.country || "UAE", 100),
            field(b.city, 100, true),
            field(b.address, 500, true),
            lat,
            lng,
            field(b.phone || "", 50),
          ],
        )
      ).rows[0],
    };
  }
  @Post("providers/:id/media") async uploadMedia(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const b = careInput(input, ["caption", "type", "content"]);
    if (
      !["image/png", "image/jpeg"].includes(b.type) ||
      typeof b.content !== "string" ||
      b.content.length > 1400000 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(b.content)
    )
      throw new BadRequestException("Choose a PNG or JPEG up to 1 MB");
    const content = Buffer.from(b.content, "base64");
    if (
      !content.length ||
      content.length > 1048576 ||
      (b.type === "image/png"
        ? content.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
        : content.subarray(0, 3).toString("hex") !== "ffd8ff")
    )
      throw new BadRequestException("Invalid image");
    if (
      (
        await db.query(
          "SELECT count(*)::int count FROM care_media WHERE provider_id=$1",
          [id],
        )
      ).rows[0].count >= 20
    )
      throw new BadRequestException("Gallery limit reached");
    return {
      record: (
        await db.query(
          "INSERT INTO care_media(id,provider_id,caption,content_type,content) VALUES($1,$2,$3,$4,$5) RETURNING id,caption,content_type",
          [randomUUID(), id, field(b.caption || "", 200), b.type, content],
        )
      ).rows[0],
    };
  }
  @Get("media/:id") async privateMedia(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const r = (
      await db.query("SELECT * FROM care_media WHERE id=$1", [uuid(id)])
    ).rows[0];
    if (!r) throw new NotFoundException();
    await providerOwner(req.account, r.provider_id);
    res.setHeader("Content-Type", r.content_type);
    res.send(r.content);
  }
  @Post("providers/:id/details/:kind/:record/remove") async removeDetail(
    @Param("id") id: string,
    @Param("kind") kind: string,
    @Param("record") record: string,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const tables: Record<string, string> = {
      hours: "care_provider_hours",
      licenses: "care_licenses",
      branches: "care_branches",
      media: "care_media",
    };
    if (!tables[kind]) throw new NotFoundException();
    const r = await db.query(
      `DELETE FROM ${tables[kind]} WHERE id=$1 AND provider_id=$2 RETURNING id`,
      [uuid(record), id],
    );
    if (!r.rows[0]) throw new NotFoundException();
    return { success: true };
  }
  @Get("providers/:id/team") async team(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    return {
      items: (
        await db.query(
          "SELECT u.id,u.name,u.email,u.role,m.permission FROM provider_memberships m JOIN app_users u ON u.id=m.user_id WHERE m.provider_id=$1",
          [id],
        )
      ).rows,
    };
  }
  @Post("providers/:id/team") async grant(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const b = careInput(input, ["email", "permission"]);
    if (!["manager", "doctor", "technician", "billing"].includes(b.permission))
      throw new BadRequestException("Invalid team permission");
    const u = (
      await db.query(
        "SELECT id,role FROM app_users WHERE email=$1 AND status='active'",
        [field(b.email, 254, true).toLowerCase()],
      )
    ).rows[0];
    if (!u || u.role === "patient")
      throw new BadRequestException("Choose an active business account");
    if (b.permission === "doctor" && !["doctor", "surgeon"].includes(u.role))
      throw new BadRequestException("Choose a doctor account");
    if (
      b.permission === "technician" &&
      !["lab", "technician"].includes(u.role)
    )
      throw new BadRequestException("Choose a technician account");
    await db.query(
      `INSERT INTO provider_memberships(provider_id,user_id,permission) VALUES($1,$2,$3) ON CONFLICT(provider_id,user_id) DO UPDATE SET permission=excluded.permission WHERE provider_memberships.permission<>'owner'`,
      [id, u.id, b.permission],
    );
    await db.query(
      "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
      [req.account.id, "team.granted", id + ":" + u.id],
    );
    return { success: true };
  }
  @Post("providers/:id/team/:user/remove") async revoke(
    @Param("id") id: string,
    @Param("user") user: string,
    @Req() req: any,
  ) {
    await providerOwner(req.account, id);
    const r = await db.query(
      "DELETE FROM provider_memberships WHERE provider_id=$1 AND user_id=$2 AND permission<>'owner' RETURNING user_id",
      [id, uuid(user)],
    );
    if (!r.rows[0])
      throw new BadRequestException("Owner access cannot be removed here");
    await db.query(
      "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
      [req.account.id, "team.revoked", id + ":" + user],
    );
    return { success: true };
  }
  @Get("dependents") async dependents(@Req() req: any) {
    return {
      items: (
        await db.query(
          "SELECT * FROM care_dependents WHERE owner_id=$1 ORDER BY name",
          [req.account.id],
        )
      ).rows,
    };
  }
  @Post("dependents") async dependent(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, ["name", "birthDate", "relationship"]);
    const date = b.birthDate ? field(b.birthDate, 10) : null;
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        Date.parse(date) > Date.now())
    )
      throw new BadRequestException("Invalid birth date");
    return {
      record: (
        await db.query(
          "INSERT INTO care_dependents(id,owner_id,name,birth_date,relationship) VALUES($1,$2,$3,$4,$5) RETURNING *",
          [
            randomUUID(),
            req.account.id,
            field(b.name, 150, true),
            date,
            field(b.relationship, 50, true),
          ],
        )
      ).rows[0],
    };
  }
  @Get("services") async services(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT s.*,p.name provider_name FROM care_services s JOIN providers p ON p.id=s.provider_id WHERE ${managed} ORDER BY s.created_at DESC LIMIT 200`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Post("services") async service(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, [
      "providerId",
      "name",
      "description",
      "price",
      "duration",
      "mode",
      "preparation",
    ]);
    await providerAccess(req.account, b.providerId);
    if (!["In clinic", "Home visit"].includes(b.mode))
      throw new BadRequestException(
        "Video service requires conferencing configuration",
      );
    const duration = Number(b.duration);
    if (!Number.isInteger(duration) || duration < 5 || duration > 480)
      throw new BadRequestException("Invalid duration");
    return {
      record: (
        await db.query(
          "INSERT INTO care_services(id,provider_id,name,description,price_minor,duration_minutes,mode,preparation) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [
            randomUUID(),
            b.providerId,
            field(b.name, 150, true),
            field(b.description || "", 4000),
            money(b.price),
            duration,
            b.mode,
            field(b.preparation || "", 2000),
          ],
        )
      ).rows[0],
    };
  }
  @Patch("services/:id") async serviceActive(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, [
      "active",
      "name",
      "description",
      "price",
      "duration",
      "mode",
      "preparation",
    ]);
    if (b.active !== undefined && typeof b.active !== "boolean")
      throw new BadRequestException();
    const s = (
      await db.query("SELECT * FROM care_services WHERE id=$1", [uuid(id)])
    ).rows[0];
    if (!s) throw new NotFoundException();
    await providerAccess(req.account, s.provider_id);
    if (b.mode !== undefined && !["In clinic", "Home visit"].includes(b.mode))
      throw new BadRequestException("Unsupported consultation mode");
    if (
      b.duration !== undefined &&
      (!Number.isInteger(Number(b.duration)) ||
        Number(b.duration) < 5 ||
        Number(b.duration) > 480)
    )
      throw new BadRequestException("Invalid duration");
    await db.query(
      `UPDATE care_services SET active=COALESCE($2,active),name=COALESCE($3,name),description=COALESCE($4,description),price_minor=COALESCE($5,price_minor),duration_minutes=COALESCE($6,duration_minutes),mode=COALESCE($7,mode),preparation=COALESCE($8,preparation) WHERE id=$1`,
      [
        id,
        b.active ?? null,
        b.name === undefined ? null : field(b.name, 150, true),
        b.description === undefined ? null : field(b.description, 4000),
        b.price === undefined ? null : money(b.price),
        b.duration === undefined ? null : Number(b.duration),
        b.mode ?? null,
        b.preparation === undefined ? null : field(b.preparation, 2000),
      ],
    );
    return { success: true };
  }
  @Get("slots") async ownSlots(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT t.*,s.name service_name,p.name provider_name FROM care_slots t JOIN care_services s ON s.id=t.service_id JOIN providers p ON p.id=s.provider_id WHERE ${managed} ORDER BY t.starts_at DESC LIMIT 200`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Patch("slots/:id") async closeSlot(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["active"]);
    if (typeof b.active !== "boolean") throw new BadRequestException();
    const s = (
      await db.query(
        "SELECT s.provider_id FROM care_slots t JOIN care_services s ON s.id=t.service_id WHERE t.id=$1",
        [uuid(id)],
      )
    ).rows[0];
    if (!s) throw new NotFoundException();
    await providerAccess(req.account, s.provider_id);
    await db.query("UPDATE care_slots SET active=$2 WHERE id=$1", [
      id,
      b.active,
    ]);
    return { success: true };
  }
  @Patch("dependents/:id") async editDependent(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["name", "birthDate", "relationship"]);
    const date = b.birthDate ? field(b.birthDate, 10) : null;
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        Date.parse(date) > Date.now())
    )
      throw new BadRequestException("Invalid birth date");
    const r = await db.query(
      "UPDATE care_dependents SET name=$3,birth_date=$4,relationship=$5 WHERE id=$1 AND owner_id=$2 RETURNING *",
      [
        uuid(id),
        req.account.id,
        field(b.name, 150, true),
        date,
        field(b.relationship, 50, true),
      ],
    );
    if (!r.rows[0]) throw new NotFoundException();
    return { record: r.rows[0] };
  }
  @Post("slots") async slot(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, ["serviceId", "startsAt"]);
    const s = (
      await db.query("SELECT * FROM care_services WHERE id=$1 AND active", [
        uuid(b.serviceId),
      ])
    ).rows[0];
    if (!s) throw new NotFoundException();
    await providerAccess(req.account, s.provider_id);
    const start = field(b.startsAt, 40, true);
    if (
      !/(Z|[+-]\d{2}:\d{2})$/.test(start) ||
      !Number.isFinite(Date.parse(start)) ||
      Date.parse(start) <= Date.now()
    )
      throw new BadRequestException("Choose a future time with timezone");
    try {
      return {
        record: (
          await db.query(
            `INSERT INTO care_slots(id,service_id,starts_at,ends_at) VALUES($1,$2,$3,$3::timestamptz+$4*interval '1 minute') RETURNING *`,
            [randomUUID(), s.id, start, s.duration_minutes],
          )
        ).rows[0],
      };
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException("This slot already exists");
      throw e;
    }
  }
  @Get("appointments") async appointments(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT a.*,p.name provider_name,p.slug,p.area,s.name service_name,s.mode,t.starts_at,t.ends_at FROM care_appointments a JOIN providers p ON p.id=a.provider_id JOIN care_services s ON s.id=a.service_id JOIN care_slots t ON t.id=a.slot_id WHERE a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=a.provider_id AND m.user_id=$1) ORDER BY t.starts_at DESC LIMIT 200`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Post("appointments") async book(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, [
      "slotId",
      "dependentId",
      "reason",
      "insurance",
      "phone",
    ]);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const slot = (
        await client.query(
          `SELECT t.*,s.provider_id,s.price_minor,s.id service,p.published,p.archived FROM care_slots t JOIN care_services s ON s.id=t.service_id JOIN providers p ON p.id=s.provider_id WHERE t.id=$1 AND t.active AND s.active AND p.published AND NOT p.archived AND t.starts_at>now() FOR UPDATE OF t`,
          [uuid(b.slotId)],
        )
      ).rows[0];
      if (!slot) throw new ConflictException("Slot is no longer available");
      await client.query("SELECT id FROM providers WHERE id=$1 FOR UPDATE", [
        slot.provider_id,
      ]);
      await client.query("SELECT id FROM app_users WHERE id=$1 FOR UPDATE", [
        req.account.id,
      ]);
      const overlap = await client.query(
        `SELECT a.id FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE a.status IN ('Requested','Confirmed') AND (a.provider_id=$1 OR a.patient_id=$2) AND t.starts_at<$4 AND t.ends_at>$3 LIMIT 1`,
        [slot.provider_id, req.account.id, slot.starts_at, slot.ends_at],
      );
      if (overlap.rows.length)
        throw new ConflictException(
          "Provider or patient already has an overlapping appointment",
        );
      let name = req.account.name;
      if (b.dependentId) {
        const d = (
          await client.query(
            "SELECT name FROM care_dependents WHERE id=$1 AND owner_id=$2",
            [uuid(b.dependentId), req.account.id],
          )
        ).rows[0];
        if (!d) throw new NotFoundException("Dependent not found");
        name = d.name;
      }
      const a = (
        await client.query(
          `INSERT INTO care_appointments(id,patient_id,dependent_id,slot_id,provider_id,service_id,reason,insurance,patient_name,phone,price_minor) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [
            randomUUID(),
            req.account.id,
            b.dependentId || null,
            slot.id,
            slot.provider_id,
            slot.service,
            field(b.reason || "", 3000),
            field(b.insurance || "", 150),
            name,
            field(b.phone || req.account.phone || "", 50),
            slot.price_minor,
          ],
        )
      ).rows[0];
      await client.query(
        "INSERT INTO care_history(appointment_id,actor_id,status) VALUES($1,$2,$3)",
        [a.id, req.account.id, "Requested"],
      );
      await client.query(
        "INSERT INTO care_invoices(id,appointment_id,amount_minor) VALUES($1,$2,$3)",
        [randomUUID(), a.id, a.price_minor],
      );
      await notify(client, a, "Appointment requested");
      await client.query("COMMIT");
      return { record: a };
    } catch (e: any) {
      await client.query("ROLLBACK");
      if (e.code === "23505")
        throw new ConflictException("Slot has just been booked");
      throw e;
    } finally {
      client.release();
    }
  }
  @Patch("appointments/:id") async update(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["status"]);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const a = await appointmentAccess(req.account, id, client, true);
      transition(
        a.status,
        b.status,
        a.is_patient && req.account.role !== "admin",
      );
      if (b.status === "Completed") {
        const t = (
          await client.query("SELECT starts_at FROM care_slots WHERE id=$1", [
            a.slot_id,
          ])
        ).rows[0];
        if (new Date(t.starts_at).getTime() > Date.now())
          throw new ConflictException("Appointment has not started");
      }
      await client.query(
        "UPDATE care_appointments SET status=$2,updated_at=now() WHERE id=$1",
        [id, b.status],
      );
      await client.query(
        "INSERT INTO care_history(appointment_id,actor_id,status) VALUES($1,$2,$3)",
        [id, req.account.id, b.status],
      );
      if (["Cancelled", "Rejected"].includes(b.status))
        await client.query(
          `UPDATE care_invoices SET status='Cancelled' WHERE appointment_id=$1 AND status='Issued'`,
          [id],
        );
      await notify(client, a, "Appointment " + b.status.toLowerCase());
      await client.query("COMMIT");
      return { success: true };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  @Get("history/:id") async history(@Param("id") id: string, @Req() req: any) {
    await appointmentAccess(req.account, id);
    return {
      items: (
        await db.query(
          "SELECT status,created_at FROM care_history WHERE appointment_id=$1 ORDER BY id",
          [id],
        )
      ).rows,
    };
  }
  @Post("appointments/:id/reschedule") async reschedule(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["slotId"]);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const a = await appointmentAccess(req.account, id, client, true);
      if (!["Requested", "Confirmed"].includes(a.status))
        throw new ConflictException("Appointment cannot be rescheduled");
      const slot = (
        await client.query(
          `SELECT * FROM care_slots WHERE id=$1 AND service_id=$2 AND active AND starts_at>now() FOR UPDATE`,
          [uuid(b.slotId), a.service_id],
        )
      ).rows[0];
      if (!slot)
        throw new ConflictException(
          "Choose an available slot for the same service",
        );
      await client.query("SELECT id FROM providers WHERE id=$1 FOR UPDATE", [
        a.provider_id,
      ]);
      await client.query("SELECT id FROM app_users WHERE id=$1 FOR UPDATE", [
        a.patient_id,
      ]);
      if (
        (
          await client.query(
            `SELECT a.id FROM care_appointments a JOIN care_slots t ON t.id=a.slot_id WHERE a.id<>$5 AND a.status IN ('Requested','Confirmed','Completed') AND (a.provider_id=$1 OR a.patient_id=$2) AND t.starts_at<$4 AND t.ends_at>$3 LIMIT 1`,
            [a.provider_id, a.patient_id, slot.starts_at, slot.ends_at, a.id],
          )
        ).rows.length
      )
        throw new ConflictException("Time is no longer available");
      await client.query(
        `UPDATE care_appointments SET slot_id=$2,status='Requested',updated_at=now() WHERE id=$1`,
        [id, slot.id],
      );
      await client.query(
        "INSERT INTO care_history(appointment_id,actor_id,status) VALUES($1,$2,$3)",
        [id, req.account.id, "Rescheduled · Requested"],
      );
      await notify(client, a, "Appointment rescheduled; awaiting confirmation");
      await client.query("COMMIT");
      return { success: true };
    } catch (e: any) {
      await client.query("ROLLBACK");
      if (e.code === "23505")
        throw new ConflictException("Slot has just been booked");
      throw e;
    } finally {
      client.release();
    }
  }
  @Get("records") async records(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT r.*,a.patient_name,p.name provider_name FROM care_records r JOIN care_appointments a ON a.id=r.appointment_id JOIN providers p ON p.id=a.provider_id WHERE ($2 OR r.author_id=$1 OR (a.patient_id=$1 AND r.status<>'Draft') OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.user_id=$1 AND m.provider_id=a.provider_id AND (r.kind='message' OR ($3 AND m.permission IN ('owner','doctor','technician')))) OR (r.kind IN ('lab_order','report') AND r.status<>'Draft' AND EXISTS(SELECT 1 FROM provider_memberships m WHERE m.user_id=$1 AND m.provider_id=r.lab_provider_id AND m.permission IN ('owner','manager','technician')))) ORDER BY r.created_at DESC LIMIT 200`,
          [
            req.account.id,
            req.account.role === "admin",
            ["doctor", "surgeon", "lab", "technician"].includes(
              req.account.role,
            ),
          ],
        )
      ).rows,
    };
  }
  @Post("records") async record(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, [
      "appointmentId",
      "kind",
      "title",
      "body",
      "labProviderId",
      "fileId",
      "status",
    ]);
    if (
      !["note", "prescription", "lab_order", "report", "message"].includes(
        b.kind,
      )
    )
      throw new BadRequestException("Invalid record type");
    const a = await appointmentAccess(req.account, b.appointmentId);
    if (
      b.kind !== "message" &&
      (a.is_patient ||
        !["doctor", "surgeon", "admin", "lab"].includes(req.account.role))
    )
      throw new ForbiddenException("Clinical author access required");
    if (b.kind !== "message" && req.account.role !== "admin") {
      if (req.account.status !== "active")
        throw new ForbiddenException(
          "An approved business account is required",
        );
      const grant = await db.query(
        "SELECT provider_id FROM provider_memberships WHERE provider_id=$1 AND user_id=$2 AND permission IN ('owner','doctor')",
        [a.provider_id, req.account.id],
      );
      if (!grant.rows[0])
        throw new ForbiddenException("Clinical team permission required");
    }
    if (
      b.kind === "prescription" &&
      !["doctor", "surgeon", "admin"].includes(req.account.role)
    )
      throw new ForbiddenException("Prescriber access required");
    const status =
      b.kind === "lab_order"
        ? "Requested"
        : b.kind === "message"
          ? "Released"
          : b.status || "Draft";
    if (!["Draft", "Released", "Requested"].includes(status))
      throw new BadRequestException("Invalid status");
    let lab = null;
    if (b.labProviderId) {
      const p = (
        await db.query(
          `SELECT id FROM providers WHERE id=$1 AND kind='lab' AND published AND NOT archived`,
          [field(b.labProviderId, 150, true)],
        )
      ).rows[0];
      if (!p) throw new BadRequestException("Choose a published laboratory");
      lab = p.id;
    }
    if (b.kind === "lab_order" && !lab)
      throw new BadRequestException("Choose a laboratory");
    if (
      b.fileId &&
      !(
        await db.query(
          "SELECT id FROM account_files WHERE id=$1 AND owner_id=$2",
          [uuid(b.fileId), req.account.id],
        )
      ).rows[0]
    )
      throw new NotFoundException("File not found");
    return {
      record: (
        await db.query(
          "INSERT INTO care_records(id,appointment_id,author_id,kind,title,body,lab_provider_id,file_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            randomUUID(),
            a.id,
            req.account.id,
            b.kind,
            field(b.title, 150, true),
            field(b.body, 12000, true),
            lab,
            b.fileId || null,
            status,
          ],
        )
      ).rows[0],
    };
  }
  @Patch("records/:id") async recordUpdate(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["status", "body"]);
    const r = (
      await db.query("SELECT * FROM care_records WHERE id=$1", [uuid(id)])
    ).rows[0];
    if (!r) throw new NotFoundException();
    const labAccess =
      r.lab_provider_id &&
      (
        await db.query(
          "SELECT provider_id FROM provider_memberships WHERE provider_id=$1 AND user_id=$2 AND permission IN ('owner','manager','technician')",
          [r.lab_provider_id, req.account.id],
        )
      ).rows[0];
    if (
      req.account.role !== "admin" &&
      r.author_id !== req.account.id &&
      !labAccess
    )
      throw new NotFoundException();
    if (r.kind === "lab_order") {
      const stages: Record<string, string> = {
        Requested: "Accepted",
        Accepted: "Collected",
        Collected: "Processing",
        Processing: "Completed",
      };
      if (req.account.role !== "admin" && (!labAccess || !['lab','technician'].includes(req.account.role) || req.account.status !== 'active'))
        throw new ForbiddenException("Assigned laboratory access required");
      if (stages[r.status] !== b.status)
        throw new ConflictException("Invalid lab stage");
    } else if (r.status !== "Draft" || b.status !== "Released")
      throw new ConflictException("Released records cannot be overwritten");
    const updated = (
        await db.query(
          "UPDATE care_records SET status=$2,body=COALESCE($3,body),updated_at=now() WHERE id=$1 AND status=$4 RETURNING *",
          [
            id,
            b.status,
            b.body === undefined ? null : field(b.body, 12000, true),
            r.status,
          ],
        )
      ).rows[0];
    if (!updated) throw new ConflictException('Record changed. Refresh and try again');
    return {record: updated};
  }
  @Post("lab-reports/:order") async labReport(
    @Param("order") order: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["title", "body", "fileId"]);
    const r = (
      await db.query(
        `SELECT * FROM care_records WHERE id=$1 AND kind='lab_order' AND status IN ('Processing','Completed')`,
        [uuid(order)],
      )
    ).rows[0];
    if (!r) throw new NotFoundException();
    await providerAccess(req.account, r.lab_provider_id);
    if (
      !["lab", "admin"].includes(req.account.role) ||
      req.account.status !== "active"
    )
      throw new ForbiddenException("Laboratory owner must release reports");
    if (
      b.fileId &&
      !(
        await db.query(
          "SELECT id FROM account_files WHERE id=$1 AND owner_id=$2",
          [uuid(b.fileId), req.account.id],
        )
      ).rows[0]
    )
      throw new NotFoundException();
    return {
      record: (
        await db.query(
          `INSERT INTO care_records(id,appointment_id,author_id,kind,title,body,lab_provider_id,file_id,status) VALUES($1,$2,$3,'report',$4,$5,$6,$7,'Released') RETURNING *`,
          [
            randomUUID(),
            r.appointment_id,
            req.account.id,
            field(b.title, 150, true),
            field(b.body, 12000, true),
            r.lab_provider_id,
            b.fileId || null,
          ],
        )
      ).rows[0],
    };
  }
  @Get("invoices") async invoices(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT i.*,a.patient_name,p.name provider_name FROM care_invoices i JOIN care_appointments a ON a.id=i.appointment_id JOIN providers p ON p.id=a.provider_id WHERE a.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1) ORDER BY i.created_at DESC LIMIT 200`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Patch("invoices/:id") async pay(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    const b = careInput(input, ["method"]);
    if (!["Cash", "Bank transfer"].includes(b.method))
      throw new BadRequestException(
        "Only received offline payments can be recorded",
      );
    const i = (
      await db.query("SELECT * FROM care_invoices WHERE id=$1", [uuid(id)])
    ).rows[0];
    if (!i) throw new NotFoundException();
    const a = await appointmentAccess(req.account, i.appointment_id);
    if (a.is_patient && req.account.role !== "admin")
      throw new ForbiddenException("Provider must record received payment");
    const result = await db.query(
      `UPDATE care_invoices SET status='Paid',payment_method=$2,paid_at=now() WHERE id=$1 AND status='Issued' RETURNING *`,
      [id, b.method],
    );
    if (!result.rows[0]) throw new ConflictException("Invoice is not payable");
    return { record: result.rows[0] };
  }
  @Get("notifications") async notifications(@Req() req: any) {
    return {
      items: (
        await db.query(
          "SELECT * FROM care_notifications WHERE recipient_id=$1 ORDER BY created_at DESC LIMIT 100",
          [req.account.id],
        )
      ).rows,
    };
  }
  @Patch("notifications/:id") async read(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    const r = await db.query(
      "UPDATE care_notifications SET read_at=now() WHERE id=$1 AND recipient_id=$2 RETURNING id",
      [uuid(id), req.account.id],
    );
    if (!r.rows[0]) throw new NotFoundException();
    return { success: true };
  }
  @Get("favorites") async favorites(@Req() req: any) {
    return {
      items: (
        await db.query(
          "SELECT p.id,p.name,p.slug,p.kind,p.area FROM care_favorites f JOIN providers p ON p.id=f.provider_id WHERE f.user_id=$1 AND p.published AND NOT p.archived",
          [req.account.id],
        )
      ).rows,
    };
  }
  @Post("favorites") async favorite(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, ["providerId", "saved"]);
    if (typeof b.saved !== "boolean") throw new BadRequestException();
    const id = field(b.providerId, 150, true);
    if (
      !(
        await db.query(
          "SELECT id FROM providers WHERE id=$1 AND published AND NOT archived",
          [id],
        )
      ).rows[0]
    )
      throw new NotFoundException();
    if (b.saved)
      await db.query(
        "INSERT INTO care_favorites(user_id,provider_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [req.account.id, id],
      );
    else
      await db.query(
        "DELETE FROM care_favorites WHERE user_id=$1 AND provider_id=$2",
        [req.account.id, id],
      );
    return { success: true };
  }
  @Get("reviews") async reviews(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT r.*,p.name provider_name FROM care_reviews r JOIN providers p ON p.id=r.provider_id WHERE r.patient_id=$1 OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1) ORDER BY r.created_at DESC LIMIT 100`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Post("reviews") async review(@Body() input: unknown, @Req() req: any) {
    const b = careInput(input, ["appointmentId", "rating", "comment"]);
    const a = await appointmentAccess(req.account, b.appointmentId);
    if (!a.is_patient || a.status !== "Completed")
      throw new ForbiddenException("Review your completed appointment");
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new BadRequestException("Invalid rating");
    try {
      return {
        record: (
          await db.query(
            "INSERT INTO care_reviews(id,appointment_id,patient_id,provider_id,rating,comment) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            [
              randomUUID(),
              a.id,
              req.account.id,
              a.provider_id,
              rating,
              field(b.comment, 4000, true),
            ],
          )
        ).rows[0],
      };
    } catch (e: any) {
      if (e.code === "23505") throw new ConflictException("Already reviewed");
      throw e;
    }
  }
  @Patch("reviews/:id") async moderate(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    if (req.account.role !== "admin") throw new ForbiddenException();
    const b = careInput(input, ["status"]);
    if (!["Published", "Hidden"].includes(b.status))
      throw new BadRequestException();
    const r = await db.query(
      "UPDATE care_reviews SET status=$2 WHERE id=$1 RETURNING *",
      [uuid(id), b.status],
    );
    if (!r.rows[0]) throw new NotFoundException();
    return { record: r.rows[0] };
  }
  @Get("claims") async claims(@Req() req: any) {
    return {
      items: (
        await db.query(
          `SELECT c.*,p.name provider_name FROM care_claims c JOIN providers p ON p.id=c.provider_id WHERE c.user_id=$1 OR $2 ORDER BY c.created_at DESC LIMIT 100`,
          [req.account.id, req.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Post("claims") async claim(@Body() input: unknown, @Req() req: any) {
    if (req.account.role === "patient")
      throw new ForbiddenException("Business account required");
    const b = careInput(input, ["providerId", "evidence"]);
    if (
      !(
        await db.query(
          "SELECT id FROM providers WHERE id=$1 AND published AND NOT archived",
          [field(b.providerId, 150, true)],
        )
      ).rows[0]
    )
      throw new NotFoundException();
    return {
      record: (
        await db.query(
          "INSERT INTO care_claims(id,user_id,provider_id,evidence) VALUES($1,$2,$3,$4) RETURNING *",
          [
            randomUUID(),
            req.account.id,
            b.providerId,
            field(b.evidence, 5000, true),
          ],
        )
      ).rows[0],
    };
  }
  @Patch("claims/:id") async decideClaim(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() req: any,
  ) {
    if (req.account.role !== "admin") throw new ForbiddenException();
    const b = careInput(input, ["status"]);
    if (!["Approved", "Rejected"].includes(b.status))
      throw new BadRequestException();
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const r = (
        await client.query(
          `UPDATE care_claims SET status=$2,reviewed_by=$3 WHERE id=$1 AND status='Pending' RETURNING *`,
          [uuid(id), b.status, req.account.id],
        )
      ).rows[0];
      if (!r)
        throw new ConflictException("Claim already reviewed or unavailable");
      if (b.status === "Approved")
        await client.query(
          "INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [r.provider_id, r.user_id],
        );
      await client.query(
        "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
        [req.account.id, "claim." + b.status.toLowerCase(), id],
      );
      await client.query("COMMIT");
      return { record: r };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
@Module({
  imports: [AccountsModule],
  controllers: [PublicCareController, CareController],
})
export class CareModule {}
