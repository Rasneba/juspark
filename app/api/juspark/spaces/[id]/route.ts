import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT s.*,
        s.has_covered as is_covered,
        s.has_ev_charging as is_ev_charger,
        s.total_slots as total_spots,
        COALESCE(s.available_slots, s.total_slots) as available_spots,
        (SELECT json_agg(json_build_object('id', sp.id, 'photo_url', sp.photo_url, 'is_primary', sp.is_primary) ORDER BY sp.sort_order) FROM juspark_space_photos sp WHERE sp.space_id = s.id) as photos,
        (SELECT json_agg(json_build_object('rate_type', rate_type, 'price', price)) FROM juspark_space_pricing WHERE space_id = s.id) as pricing,
        (SELECT json_agg(json_build_object('id', r.id, 'rating', r.rating, 'comment', r.comment, 'created_at', r.created_at, 'user_name', u.name) ORDER BY r.created_at DESC)
          FROM juspark_reviews r JOIN juspark_users u ON r.user_id = u.id WHERE r.space_id = s.id LIMIT 10) as reviews
       FROM juspark_spaces s WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const space = result.rows[0];
    space.pricing = space.pricing || [];
    space.photos = space.photos || [];
    space.reviews = space.reviews || [];

    return NextResponse.json(space);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name", "description", "address", "latitude", "longitude", "space_type", "is_covered", "is_ev_charger", "is_24_7", "total_spots", "available_spots", "status"];
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${key} = $${idx}`);
        vals.push(body[key]);
        idx++;
      }
    }

    if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    sets.push("updated_at = CURRENT_TIMESTAMP");
    vals.push(id);

    const result = await pool.query(
      `UPDATE juspark_spaces SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      vals
    );

    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.pricing && Array.isArray(body.pricing)) {
      await pool.query("DELETE FROM juspark_space_pricing WHERE space_id = $1", [id]);
      for (const p of body.pricing) {
        if (p.price > 0) {
          await pool.query(
            "INSERT INTO juspark_space_pricing (space_id, rate_type, price) VALUES ($1, $2, $3)",
            [id, p.rate_type, p.price]
          );
        }
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query("DELETE FROM juspark_spaces WHERE id = $1", [id]);
    return NextResponse.json({ message: "Space deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
