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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let query = `SELECT s.*, 
      (SELECT photo_url FROM juspark_space_photos WHERE space_id = s.id AND is_primary = TRUE LIMIT 1) as primary_photo,
      (SELECT json_agg(json_build_object('rate_type', rate_type, 'price', price)) FROM juspark_space_pricing WHERE space_id = s.id) as pricing
      FROM juspark_spaces s WHERE s.status = 'active'`;
    const params: any[] = [];
    let idx = 1;

    if (type && type !== "all") {
      query += ` AND s.space_type = $${idx}`;
      params.push(type);
      idx++;
    }
    if (search) {
      query += ` AND (s.name ILIKE $${idx} OR s.address ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    query += " ORDER BY s.created_at DESC LIMIT 50";

    const result = await pool.query(query, params);
    const spaces = result.rows.map((r) => ({
      ...r,
      pricing: r.pricing || [],
      distance_km: lat && lng ? haversine(lat, lng, parseFloat(r.latitude), parseFloat(r.longitude)) : null,
    }));

    if (lat && lng) {
      spaces.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    }

    return NextResponse.json(spaces);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getJusparkUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, address, latitude, longitude, space_type, is_covered, is_ev_charger, is_24_7, total_spots, pricing } = body;

    if (!name || !address) {
      return NextResponse.json({ error: "Name and address required" }, { status: 400 });
    }

    await pool.query("UPDATE juspark_users SET is_host = TRUE WHERE id = $1", [user.id]);

    const result = await pool.query(
      `INSERT INTO juspark_spaces (host_id, name, description, address, latitude, longitude, space_type, is_covered, is_ev_charger, is_24_7, total_spots, available_spots)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11) RETURNING *`,
      [user.id, name, description || null, address, latitude || null, longitude || null, space_type || "lot", is_covered || false, is_ev_charger || false, is_24_7 !== false, total_spots || 1]
    );

    const space = result.rows[0];

    if (pricing && Array.isArray(pricing)) {
      for (const p of pricing) {
        if (p.price > 0) {
          await pool.query(
            "INSERT INTO juspark_space_pricing (space_id, rate_type, price) VALUES ($1, $2, $3)",
            [space.id, p.rate_type, p.price]
          );
        }
      }
    }

    return NextResponse.json(space, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
