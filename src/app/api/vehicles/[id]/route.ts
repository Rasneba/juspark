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

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: user.userId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { plateNumber, make, model, color, nickname, isDefault } = body;

    if (plateNumber && plateNumber !== vehicle.plateNumber) {
      const existing = await prisma.vehicle.findFirst({
        where: {
          userId: user.userId,
          plateNumber: plateNumber.toUpperCase().trim(),
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Vehicle with this plate number already exists" },
          { status: 409 }
        );
      }
    }

    if (isDefault) {
      await prisma.vehicle.updateMany({
        where: { userId: user.userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: plateNumber
          ? plateNumber.toUpperCase().trim()
          : undefined,
        make: make !== undefined ? (make || null) : undefined,
        model: model !== undefined ? (model || null) : undefined,
        color: color !== undefined ? (color || null) : undefined,
        nickname: nickname !== undefined ? (nickname || null) : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: user.userId },
      include: {
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    if (vehicle.bookings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete vehicle with active bookings",
        },
        { status: 409 }
      );
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json({ message: "Vehicle removed" });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
