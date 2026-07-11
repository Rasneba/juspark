import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const exists = await pool.query("SELECT id FROM juspark_users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO juspark_users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, is_host, created_at`,
      [name, email, password_hash, phone || null]
    );

    const user = result.rows[0];
    const { SignJWT } = await import("jose");
    const token = await new SignJWT({ id: user.id, email: user.email, type: "juspark" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || "genius-hrms-secret-key-2026"));

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
