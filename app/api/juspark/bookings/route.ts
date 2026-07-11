import { NextResponse } from "next/server";
import { Pool } from "pg";
import { jwtVerify } from "jose";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getJusparkUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(
      auth.split(" ")[1],
      new TextEncoder().encode(process.env.JWT_SECRET || "genius-hrms-secret-key-2026")
    );
    if (payload.type !== "juspark") return null;
    return payload as { id: number; email: string; type: string };
  } catch {
    return null;
  }
}

function generateRef(): string {
  return `JP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const user = await getJusparkUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { space_id, vehicle_plate, start_time, end_time, duration_minutes } = await req.json();

    if (!space_id || !start_time) {
      return NextResponse.json({ error: "space_id and start_time required" }, { status: 400 });
    }

    const spaceRes = await pool.query("SELECT * FROM juspark_spaces WHERE id = $1 AND status = 'active'", [space_id]);
    if (spaceRes.rows.length === 0) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    const space = spaceRes.rows[0];
    if (space.available_spots <= 0) return NextResponse.json({ error: "No spots available" }, { status: 400 });

    const pricingRes = await pool.query("SELECT * FROM juspark_space_pricing WHERE space_id = $1 ORDER BY price ASC", [space_id]);
    const pricing = pricingRes.rows;

    const dur = duration_minutes || (end_time ? Math.ceil((new Date(end_time).getTime() - new Date(start_time).getTime()) / 60000) : 60);
    let total = 0;
    if (pricing.length > 0) {
      const hourly = pricing.find((p: any) => p.rate_type === "hourly");
      const daily = pricing.find((p: any) => p.rate_type === "daily");
      if (dur >= 1440 && daily) total = Math.ceil(dur / 1440) * parseFloat(daily.price);
      else if (hourly) total = Math.ceil(dur / 60) * parseFloat(hourly.price);
      else total = pricing[0].price;
    }

    const booking_ref = generateRef();

    const result = await pool.query(
      `INSERT INTO juspark_bookings (booking_ref, space_id, user_id, vehicle_plate, start_time, end_time, duration_minutes, total_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'pending') RETURNING *`,
      [booking_ref, space_id, user.id, vehicle_plate || null, start_time, end_time || null, dur, total]
    );

    await pool.query(
      "UPDATE juspark_spaces SET available_spots = available_spots - 1 WHERE id = $1 AND available_spots > 0",
      [space_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getJusparkUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `SELECT b.*, s.name as space_name, s.address as space_address
      FROM juspark_bookings b JOIN juspark_spaces s ON b.space_id = s.id
      WHERE b.user_id = $1`;
    const params: any[] = [user.id];
    let idx = 2;

    if (status) {
      query += ` AND b.status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += " ORDER BY b.created_at DESC LIMIT 50";

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
