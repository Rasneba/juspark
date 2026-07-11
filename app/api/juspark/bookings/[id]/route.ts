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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT b.*, s.name as space_name, s.address as space_address, s.latitude, s.longitude
       FROM juspark_bookings b JOIN juspark_spaces s ON b.space_id = s.id WHERE b.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getJusparkUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (body.action === "cancel") {
      const result = await pool.query(
        `UPDATE juspark_bookings SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = $1
         WHERE id = $2 AND user_id = $3 AND status IN ('pending', 'confirmed') RETURNING *`,
        [body.reason || null, id, user.id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
      await pool.query("UPDATE juspark_spaces SET available_spots = available_spots + 1 WHERE id = $1", [result.rows[0].space_id]);
      return NextResponse.json(result.rows[0]);
    }

    if (body.action === "checkin") {
      const result = await pool.query(
        `UPDATE juspark_bookings SET status = 'active', checked_in_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND status = 'confirmed' RETURNING *`,
        [id, user.id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: "Cannot check in" }, { status: 400 });
      return NextResponse.json(result.rows[0]);
    }

    if (body.action === "checkout") {
      const result = await pool.query(
        `UPDATE juspark_bookings SET status = 'completed', checked_out_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING *`,
        [id, user.id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: "Cannot check out" }, { status: 400 });
      await pool.query("UPDATE juspark_spaces SET available_spots = available_spots + 1 WHERE id = $1", [result.rows[0].space_id]);
      return NextResponse.json(result.rows[0]);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
