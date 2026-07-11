import { NextResponse } from "next/server";
import { Pool } from "pg";
import { jwtVerify } from "jose";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getUser(req: Request) {
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
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await pool.query(
      "SELECT * FROM juspark_vehicles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [user.id]
    );
    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { plate_number, nickname, make, model, color } = await req.json();
    if (!plate_number?.trim()) return NextResponse.json({ error: "Plate number is required" }, { status: 400 });

    const existing = await pool.query("SELECT id FROM juspark_vehicles WHERE user_id = $1", [user.id]);
    const is_default = existing.rows.length === 0;

    const result = await pool.query(
      `INSERT INTO juspark_vehicles (user_id, plate_number, nickname, make, model, color, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, plate_number.trim().toUpperCase(), nickname || null, make || null, model || null, color || null, is_default]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
