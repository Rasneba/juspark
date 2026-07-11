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

    const [earnings, spaces, bookings, reviews] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(b.total_amount * 0.85), 0) as total_earnings, COALESCE(SUM(CASE WHEN b.payment_status = 'pending' THEN b.total_amount * 0.85 ELSE 0 END), 0) as pending_payout
        FROM juspark_bookings b JOIN juspark_spaces s ON b.space_id = s.id WHERE s.host_id = $1 AND b.status IN ('completed', 'active')`, [user.id]),
      pool.query("SELECT COUNT(*) as count FROM juspark_spaces WHERE host_id = $1", [user.id]),
      pool.query(`SELECT COUNT(*) as count FROM juspark_bookings b JOIN juspark_spaces s ON b.space_id = s.id WHERE s.host_id = $1`, [user.id]),
      pool.query(`SELECT COALESCE(AVG(r.rating), 0) as avg_rating FROM juspark_reviews r JOIN juspark_spaces s ON r.space_id = s.id WHERE s.host_id = $1`, [user.id]),
    ]);

    return NextResponse.json({
      total_earnings: parseFloat(earnings.rows[0].total_earnings),
      pending_payout: parseFloat(earnings.rows[0].pending_payout),
      total_spaces: parseInt(spaces.rows[0].count),
      total_bookings: parseInt(bookings.rows[0].count),
      average_rating: parseFloat(reviews.rows[0].avg_rating),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
