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

function generateRef(): string {
  return `JP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { space_id, vehicle_plate, start_time, end_time, duration_minutes } = await req.json();
    if (!space_id || !start_time) {
      return NextResponse.json({ error: "space_id and start_time required" }, { status: 400 });
    }

    const space = await prisma.parkingSpace.findUnique({
      where: { id: space_id, status: "active" },
      include: { pricing: { orderBy: { price: "asc" } } },
    });
    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
    if (space.availableSpots <= 0) return NextResponse.json({ error: "No spots available" }, { status: 400 });

    const dur = duration_minutes || (end_time ? Math.ceil((new Date(end_time).getTime() - new Date(start_time).getTime()) / 60000) : 60);

    let total = 0;
    if (space.pricing.length > 0) {
      const hourly = space.pricing.find((p) => p.rateType === "HOURLY");
      const daily = space.pricing.find((p) => p.rateType === "DAILY");
      if (dur >= 1440 && daily) total = Math.ceil(dur / 1440) * daily.price;
      else if (hourly) total = Math.ceil(dur / 60) * hourly.price;
      else total = space.pricing[0].price;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        spaceId: space_id,
        vehiclePlate: vehicle_plate || null,
        startTime: new Date(start_time),
        endTime: end_time ? new Date(end_time) : null,
        durationMinutes: dur,
        totalAmount: total,
        platformFee: total * 0.15,
        hostPayout: total * 0.85,
        status: "confirmed",
        paymentStatus: "pending",
        bookingRef: generateRef(),
      },
    });

    await prisma.parkingSpace.update({
      where: { id: space_id },
      data: { availableSpots: { decrement: 1 } },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: { space: { select: { name: true, address: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(bookings.map((b) => ({
      id: b.id,
      space_id: b.spaceId,
      space_name: b.space.name,
      space_address: b.space.address,
      user_id: b.userId,
      vehicle_plate: b.vehiclePlate,
      start_time: b.startTime,
      end_time: b.endTime,
      duration_minutes: b.durationMinutes,
      amount: b.totalAmount,
      platform_fee: b.platformFee,
      host_payout: b.hostPayout,
      status: b.status,
      payment_status: b.paymentStatus,
      booking_ref: b.bookingRef,
      checkin_time: b.checkinTime,
      checkout_time: b.checkoutTime,
      created_at: b.createdAt,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
