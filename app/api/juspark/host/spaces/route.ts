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
    const user = await getJusparkUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await pool.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM juspark_bookings b WHERE b.space_id = s.id) as total_bookings,
        (SELECT json_agg(json_build_object('rate_type', rate_type, 'price', price)) FROM juspark_space_pricing WHERE space_id = s.id) as pricing
       FROM juspark_spaces s WHERE s.host_id = $1 ORDER BY s.created_at DESC`,
      [user.id]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
