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

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: user.userId },
      include: {
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          },
          select: { id: true, spaceId: true, startTime: true, endTime: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("List vehicles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plateNumber, make, model, color, nickname, isDefault } = body;

    if (!plateNumber) {
      return NextResponse.json(
        { error: "Plate number is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.vehicle.findFirst({
      where: {
        userId: user.userId,
        plateNumber: plateNumber.toUpperCase().trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vehicle with this plate number already exists" },
        { status: 409 }
      );
    }

    if (isDefault) {
      await prisma.vehicle.updateMany({
        where: { userId: user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.userId,
        plateNumber: plateNumber.toUpperCase().trim(),
        make: make || null,
        model: model || null,
        color: color || null,
        nickname: nickname || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    console.error("Add vehicle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
