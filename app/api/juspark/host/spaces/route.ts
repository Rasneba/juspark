import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

async function getUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(
      auth.split(" ")[1],
      new TextEncoder().encode(process.env.JWT_SECRET || "genius-hrms-secret-key-2026")
    );
    if (payload.type !== "juspark") return null;
    return payload as { id: string; email: string; type: string };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const spaces = await prisma.parkingSpace.findMany({
      where: { hostId: user.id },
      include: {
        pricing: true,
        bookings: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(spaces.map((s) => ({
      id: s.id,
      host_id: s.hostId,
      name: s.name,
      description: s.description,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      space_type: s.spaceType.toLowerCase(),
      is_covered: s.isCovered,
      is_ev_charger: s.isEvCharger,
      is_24_7: s.is247,
      total_spots: s.totalSpots,
      available_spots: s.availableSpots,
      status: s.status,
      is_active: s.status === "ACTIVE",
      total_bookings: s.bookings.length,
      booking_count: s.bookings.length,
      pricing: s.pricing.map((p) => ({ rate_type: p.rateType.toLowerCase(), price: p.price })),
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
