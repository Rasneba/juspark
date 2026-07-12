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
    const { id } = await params;

    const space = await prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        pricing: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ space });
  } catch (error) {
    console.error("Get parking space error:", error);
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

    const space = await prisma.parkingSpace.findUnique({
      where: { id },
    });

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && space.hostId !== user.userId) {
      return NextResponse.json(
        { error: "You can only update your own parking spaces" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      spaceType,
      totalSpots,
      availableSpots,
      is247,
      heightLimit,
      status,
      images,
      pricing,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (spaceType !== undefined) updateData.spaceType = spaceType;
    if (totalSpots !== undefined) updateData.totalSpots = parseInt(totalSpots);
    if (availableSpots !== undefined) updateData.availableSpots = parseInt(availableSpots);
    if (is247 !== undefined) updateData.is247 = is247;
    if (heightLimit !== undefined) updateData.heightLimit = heightLimit ? parseFloat(heightLimit) : null;
    if (status !== undefined && user.role === "ADMIN") updateData.status = status;

    const updated = await prisma.parkingSpace.update({
      where: { id },
      data: updateData,
    });

    if (images !== undefined) {
      await prisma.parkingImage.deleteMany({ where: { spaceId: id } });
      if (images.length > 0) {
        await prisma.parkingImage.createMany({
          data: images.map((img: any, index: number) => ({
            spaceId: id,
            url: img.url,
            isPrimary: img.isPrimary || index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }
    }

    if (pricing !== undefined) {
      await prisma.parkingPrice.deleteMany({ where: { spaceId: id } });
      if (pricing.length > 0) {
        await prisma.parkingPrice.createMany({
          data: pricing.map((p: any) => ({
            spaceId: id,
            rateType: p.rateType || "HOURLY",
            price: parseFloat(p.price),
            minDuration: p.minDuration ? parseInt(p.minDuration) : null,
            maxDuration: p.maxDuration ? parseInt(p.maxDuration) : null,
          })),
        });
      }
    }

    const result = await prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        pricing: true,
      },
    });

    return NextResponse.json({ space: result });
  } catch (error) {
    console.error("Update parking space error:", error);
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

    const space = await prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          },
        },
      },
    });

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && space.hostId !== user.userId) {
      return NextResponse.json(
        { error: "You can only delete your own parking spaces" },
        { status: 403 }
      );
    }

    if (space.bookings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete space with active bookings. Cancel or complete them first.",
        },
        { status: 409 }
      );
    }

    await prisma.parkingSpace.update({
      where: { id },
      data: { status: "DRAFT" },
    });

    return NextResponse.json({ message: "Parking space deactivated" });
  } catch (error) {
    console.error("Delete parking space error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
