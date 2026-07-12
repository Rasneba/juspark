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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { space: { select: { name: true, address: true, latitude: true, longitude: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...booking,
      space_name: booking.space.name,
      space_address: booking.space.address,
      latitude: booking.space.latitude,
      longitude: booking.space.longitude,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (body.action === "cancel") {
      const booking = await prisma.booking.findFirst({
        where: { id, userId: user.id, status: { in: ["PENDING", "CONFIRMED"] as any } },
      });
      if (!booking) return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });

      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" as any, cancelReason: body.reason || null, cancelledAt: new Date() },
      });

      await prisma.parkingSpace.update({
        where: { id: booking.spaceId },
        data: { availableSpots: { increment: 1 } },
      });

      return NextResponse.json(updated);
    }

    if (body.action === "checkin") {
      const updated = await prisma.booking.update({
        where: { id, userId: user.id, status: "CONFIRMED" as any },
        data: { status: "ACTIVE" as any, checkinTime: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "checkout") {
      const booking = await prisma.booking.findFirst({
        where: { id, userId: user.id, status: "ACTIVE" as any },
      });
      if (!booking) return NextResponse.json({ error: "Cannot check out" }, { status: 400 });

      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" as any, checkoutTime: new Date() },
      });

      await prisma.parkingSpace.update({
        where: { id: booking.spaceId },
        data: { availableSpots: { increment: 1 } },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
