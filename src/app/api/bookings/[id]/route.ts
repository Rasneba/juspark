import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

async function getAuthUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(
      auth.split(" ")[1],
      new TextEncoder().encode(process.env.JWT_SECRET || "juspark-secret-2026")
    );
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        space: {
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            pricing: true,
          },
        },
        vehicle: true,
        review: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const isOwner = booking.space.hostId === user.userId;
    const isDriver = booking.userId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isDriver && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have access to this booking" },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, cancelReason } = body;

    const validStatuses = [
      "CONFIRMED",
      "CANCELLED",
      "ACTIVE",
      "COMPLETED",
      "NO_SHOW",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const isOwner = booking.space.hostId === user.userId;
    const isDriver = booking.userId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (status === "CONFIRMED" && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host or admin can confirm bookings" },
        { status: 403 }
      );
    }

    if (status === "ACTIVE" && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host or admin can check in" },
        { status: 403 }
      );
    }

    if (status === "COMPLETED" && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host or admin can check out" },
        { status: 403 }
      );
    }

    if (status === "CANCELLED" && !isDriver && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to cancel this booking" },
        { status: 403 }
      );
    }

    if (status === "NO_SHOW" && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host or admin can mark no-show" },
        { status: 403 }
      );
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["ACTIVE", "CANCELLED", "NO_SHOW"],
      ACTIVE: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
      EXPIRED: [],
    };

    const allowed = allowedTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${booking.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    if (status === "ACTIVE") {
      updateData.checkinTime = new Date();
    }

    if (status === "COMPLETED") {
      updateData.checkoutTime = new Date();
    }

    if (status === "CANCELLED") {
      updateData.cancelReason = cancelReason || null;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          space: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          vehicle: true,
        },
      });

      if (status === "CANCELLED" || status === "NO_SHOW") {
        await tx.parkingSpace.update({
          where: { id: booking.spaceId },
          data: { availableSpots: { increment: 1 } },
        });
      }

      if (status === "CANCELLED" && booking.status === "PENDING") {
        await tx.booking.update({
          where: { id },
          data: { paymentStatus: "REFUNDED" },
        });
      }

      return updated;
    });

    return NextResponse.json({ booking: result });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
