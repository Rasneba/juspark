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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await pool.query("DELETE FROM juspark_vehicles WHERE id = $1 AND user_id = $2", [id, user.id]);
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { plate_number, nickname, make, model, color, is_default } = await req.json();

    if (is_default) {
      await pool.query("UPDATE juspark_vehicles SET is_default = false WHERE user_id = $1", [user.id]);
    }

    const result = await pool.query(
      `UPDATE juspark_vehicles SET plate_number = COALESCE($1, plate_number), nickname = COALESCE($2, nickname),
       make = COALESCE($3, make), model = COALESCE($4, model), color = COALESCE($5, color),
       is_default = COALESCE($6, is_default)
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [plate_number, nickname, make, model, color, is_default ?? null, id, user.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
