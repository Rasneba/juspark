import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SAMPLE_HOST_EMAIL = "host@juspark.et";

const SPACES = [
  {
    name: "Bole Medhanealem Parking",
    description: "Covered parking near Medhanealem Cathedral. Safe and well-lit 24/7.",
    address: "Bole Road, near Medhanealem Cathedral, Addis Ababa",
    latitude: 9.0127,
    longitude: 38.7631,
    space_type: "garage",
    is_covered: true,
    is_ev_charger: false,
    is_24_7: true,
    total_spots: 45,
    pricing: [
      { rate_type: "hourly", price: 30 },
      { rate_type: "daily", price: 200 },
      { rate_type: "monthly", price: 3500 },
    ],
  },
  {
    name: "Piassa Public Lot",
    description: "Open-air parking lot in the heart of Piassa. Easy access to shops and banks.",
    address: "Piassa, Churchill Avenue, Addis Ababa",
    latitude: 9.0345,
    longitude: 38.7512,
    space_type: "lot",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 60,
    pricing: [
      { rate_type: "hourly", price: 15 },
      { rate_type: "daily", price: 100 },
    ],
  },
  {
    name: "Megenagna Tower Parking",
    description: "Multi-level covered parking at Megenagna intersection. CCTV monitored.",
    address: "Megenagna, Ring Road, Addis Ababa",
    latitude: 9.0127,
    longitude: 38.7825,
    space_type: "garage",
    is_covered: true,
    is_ev_charger: true,
    is_24_7: true,
    total_spots: 120,
    pricing: [
      { rate_type: "hourly", price: 40 },
      { rate_type: "daily", price: 250 },
      { rate_type: "monthly", price: 4500 },
    ],
  },
  {
    name: "Arat Kilo Street Parking",
    description: "Street-side parking near Arat Kilo square. Convenient for government offices.",
    address: "Arat Kilo, Addis Ababa",
    latitude: 9.0374,
    longitude: 38.7597,
    space_type: "street",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 20,
    pricing: [
      { rate_type: "hourly", price: 10 },
    ],
  },
  {
    name: "Kazanchis Business Center Garage",
    description: "Underground garage beneath Kazanchis business district. Reserved parking available.",
    address: "Kazanchis, Addis Ababa",
    latitude: 9.0204,
    longitude: 38.7689,
    space_type: "garage",
    is_covered: true,
    is_ev_charger: false,
    is_24_7: true,
    total_spots: 80,
    pricing: [
      { rate_type: "hourly", price: 35 },
      { rate_type: "daily", price: 220 },
      { rate_type: "monthly", price: 4000 },
    ],
  },
  {
    name: "Bole Medhanalem Driveway Spot",
    description: "Private driveway parking available for short stays near Edna Mall.",
    address: "Bole Road, near Edna Mall, Addis Ababa",
    latitude: 9.0078,
    longitude: 38.7663,
    space_type: "driveway",
    is_covered: true,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 3,
    pricing: [
      { rate_type: "hourly", price: 25 },
      { rate_type: "daily", price: 150 },
    ],
  },
  {
    name: "Merkato Open Lot",
    description: "Large open parking area near Merkato. Spacious and affordable.",
    address: "Merkato, Addis Ababa",
    latitude: 9.0165,
    longitude: 38.7421,
    space_type: "lot",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 100,
    pricing: [
      { rate_type: "hourly", price: 10 },
      { rate_type: "daily", price: 80 },
    ],
  },
  {
    name: "Bole Rwanda EV Charging Garage",
    description: "Modern covered garage with Tesla-compatible EV chargers. Premium service.",
    address: "Bole Rwanda, Addis Ababa",
    latitude: 8.9944,
    longitude: 38.7765,
    space_type: "garage",
    is_covered: true,
    is_ev_charger: true,
    is_24_7: true,
    total_spots: 30,
    pricing: [
      { rate_type: "hourly", price: 50 },
      { rate_type: "daily", price: 300 },
      { rate_type: "monthly", price: 5000 },
    ],
  },
  {
    name: "Lege Tafo Lot",
    description: "Affordable open lot near Lege Tafo intersection. Great for daily commuters.",
    address: "Lege Tafo, Addis Ababa",
    latitude: 9.0401,
    longitude: 38.7450,
    space_type: "lot",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 40,
    pricing: [
      { rate_type: "hourly", price: 10 },
      { rate_type: "daily", price: 70 },
    ],
  },
  {
    name: "Meskel Square Street Parking",
    description: "Prime street parking next to Meskel Square. Walking distance to hotels.",
    address: "Meskel Square, Addis Ababa",
    latitude: 9.0113,
    longitude: 38.7610,
    space_type: "street",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 15,
    pricing: [
      { rate_type: "hourly", price: 20 },
    ],
  },
  {
    name: "Sar Betagna Covered Lot",
    description: "Covered parking near Sar Betagna. Security guard on duty.",
    address: "Sar Betagna, Addis Ababa",
    latitude: 9.0280,
    longitude: 38.7530,
    space_type: "lot",
    is_covered: true,
    is_ev_charger: false,
    is_24_7: false,
    total_spots: 25,
    pricing: [
      { rate_type: "hourly", price: 20 },
      { rate_type: "daily", price: 130 },
    ],
  },
  {
    name: "Ayat Real Estate Driveway",
    description: "Residential driveway space for rent. Quiet neighborhood.",
    address: "Ayat, Addis Ababa",
    latitude: 9.0240,
    longitude: 38.7900,
    space_type: "driveway",
    is_covered: false,
    is_ev_charger: false,
    is_24_7: true,
    total_spots: 2,
    pricing: [
      { rate_type: "hourly", price: 15 },
      { rate_type: "daily", price: 100 },
      { rate_type: "monthly", price: 2000 },
    ],
  },
];

export async function POST() {
  try {
    const hostResult = await pool.query(
      "SELECT id FROM juspark_users WHERE email = $1 LIMIT 1",
      [SAMPLE_HOST_EMAIL]
    );

    if (hostResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Host user not found. Register host@juspark.et first." },
        { status: 400 }
      );
    }

    const hostId = hostResult.rows[0].id;

    await pool.query("UPDATE juspark_users SET is_host = TRUE WHERE id = $1", [hostId]);

    const existing = await pool.query(
      "SELECT COUNT(*) FROM juspark_spaces WHERE host_id = $1",
      [hostId]
    );

    if (parseInt(existing.rows[0].count) > 0) {
      return NextResponse.json(
        { message: "Sample data already seeded. Use DELETE to re-seed.", count: existing.rows[0].count }
      );
    }

    let created = 0;

    for (const space of SPACES) {
      const result = await pool.query(
        `INSERT INTO juspark_spaces (host_id, name, description, address, latitude, longitude, space_type, has_covered, has_ev_charging, total_slots, available_slots, status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 'active', TRUE)
         RETURNING id`,
        [
          hostId,
          space.name,
          space.description,
          space.address,
          space.latitude,
          space.longitude,
          space.space_type,
          space.is_covered,
          space.is_ev_charger,
          space.total_spots,
        ]
      );

      const spaceId = result.rows[0].id;

      for (const p of space.pricing) {
        await pool.query(
          "INSERT INTO juspark_space_pricing (space_id, rate_type, price) VALUES ($1, $2, $3)",
          [spaceId, p.rate_type, p.price]
        );
      }

      created++;
    }

    return NextResponse.json({
      message: `Seeded ${created} sample parking spaces near Addis Ababa`,
      spaces: SPACES.map((s) => s.name),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const hostResult = await pool.query(
      "SELECT id FROM juspark_users WHERE email = $1 LIMIT 1",
      [SAMPLE_HOST_EMAIL]
    );
    if (hostResult.rows.length === 0) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }
    const hostId = hostResult.rows[0].id;
    const spaceIds = await pool.query(
      "SELECT id FROM juspark_spaces WHERE host_id = $1",
      [hostId]
    );
    for (const row of spaceIds.rows) {
      await pool.query("DELETE FROM juspark_space_pricing WHERE space_id = $1", [row.id]);
      await pool.query("DELETE FROM juspark_space_photos WHERE space_id = $1", [row.id]);
      await pool.query("DELETE FROM juspark_spaces WHERE id = $1", [row.id]);
    }
    return NextResponse.json({ message: `Deleted ${spaceIds.rowCount} spaces. Call POST to re-seed.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
