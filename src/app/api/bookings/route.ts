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

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { spaceId, vehicleId, startTime, endTime } = body;

    if (!spaceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "spaceId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const space = await prisma.parkingSpace.findUnique({
      where: { id: spaceId },
      include: { pricing: true },
    });

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found" },
        { status: 404 }
      );
    }

    if (space.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Parking space is not available" },
        { status: 400 }
      );
    }

    if (space.availableSpots < 1) {
      return NextResponse.json(
        { error: "No available spots" },
        { status: 400 }
      );
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const durationHours = durationMinutes / 60;

    let totalAmount = 0;
    const applicablePrice = space.pricing.find((p) => {
      if (p.rateType === "HOURLY") {
        if (p.minDuration && durationMinutes < p.minDuration) return false;
        if (p.maxDuration && durationMinutes > p.maxDuration) return false;
        return true;
      }
      if (p.rateType === "DAILY") {
        if (p.minDuration && durationHours < p.minDuration) return false;
        if (p.maxDuration && durationHours > p.maxDuration) return false;
        return true;
      }
      return false;
    });

    if (applicablePrice) {
      if (applicablePrice.rateType === "HOURLY") {
        totalAmount = parseFloat(String(applicablePrice.price)) * durationHours;
      } else if (applicablePrice.rateType === "DAILY") {
        totalAmount =
          parseFloat(String(applicablePrice.price)) *
          Math.ceil(durationHours / 24);
      } else {
        totalAmount = parseFloat(String(applicablePrice.price));
      }
    } else {
      const hourlyPrice = space.pricing.find((p) => p.rateType === "HOURLY");
      if (hourlyPrice) {
        totalAmount = parseFloat(String(hourlyPrice.price)) * durationHours;
      } else {
        return NextResponse.json(
          { error: "No pricing available for this duration" },
          { status: 400 }
        );
      }
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const platformFee = Math.round(totalAmount * 0.1 * 100) / 100;
    const hostPayout = Math.round((totalAmount - platformFee) * 100) / 100;

    let vehiclePlate = null;
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, userId: user.userId },
      });
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        );
      }
      vehiclePlate = vehicle.plateNumber;
    }

    const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const [booking, _] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          userId: user.userId,
          spaceId,
          vehicleId: vehicleId || null,
          vehiclePlate,
          startTime: startDate,
          endTime: endDate,
          durationMinutes,
          totalAmount,
          platformFee,
          hostPayout,
          status: "PENDING",
          qrCode,
        },
        include: {
          space: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          vehicle: true,
        },
      }),
      prisma.parkingSpace.update({
        where: { id: spaceId },
        data: {
          availableSpots: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.userId,
    };

    if (
      status &&
      [
        "PENDING",
        "CONFIRMED",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
        "EXPIRED",
      ].includes(status)
    ) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          space: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          vehicle: true,
          review: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
