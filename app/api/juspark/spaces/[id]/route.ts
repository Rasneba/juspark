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
    const space = await prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        pricing: true,
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    return NextResponse.json({
      id: space.id,
      host_id: space.hostId,
      name: space.name,
      description: space.description,
      address: space.address,
      latitude: space.latitude,
      longitude: space.longitude,
      space_type: space.spaceType.toLowerCase(),
      is_covered: space.isCovered,
      is_ev_charger: space.isEvCharger,
      is_24_7: space.is247,
      height_limit: space.heightLimit,
      total_spots: space.totalSpots,
      available_spots: space.availableSpots,
      status: space.status,
      rating_avg: space.ratingAvg,
      rating_count: space.ratingCount,
      primary_photo: space.primaryPhoto || space.images.find((i) => i.isPrimary)?.url || null,
      photos: space.images.map((img) => img.url),
      host_name: space.hostName,
      pricing: space.pricing.map((p) => ({
        id: p.id,
        rate_type: p.rateType.toLowerCase(),
        price: p.price,
        min_duration: p.minDuration,
        max_duration: p.maxDuration,
      })),
      reviews: space.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt,
        user_name: r.user.name,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, address, latitude, longitude, space_type, is_covered, is_ev_charger, is_24_7, total_spots, pricing } = body;

    if (!name || !address) {
      return NextResponse.json({ error: "Name and address required" }, { status: 400 });
    }

    const space = await prisma.parkingSpace.create({
      data: {
        hostId: user.id,
        name,
        description: description || null,
        address,
        latitude: latitude || 0,
        longitude: longitude || 0,
        spaceType: (space_type || "LOT").toUpperCase() as any,
        isCovered: is_covered || false,
        isEvCharger: is_ev_charger || false,
        is247: is_24_7 || false,
        totalSpots: total_spots || 1,
        availableSpots: total_spots || 1,
        status: "ACTIVE",
        pricing: pricing && Array.isArray(pricing)
          ? { create: pricing.filter((p: any) => p.price > 0).map((p: any) => ({ rateType: (p.rate_type || "HOURLY").toUpperCase() as any, price: p.price })) }
          : undefined,
      },
      include: { pricing: true },
    });

    return NextResponse.json({
      ...space,
      space_type: space.spaceType.toLowerCase(),
      pricing: space.pricing.map((p) => ({ ...p, rate_type: p.rateType.toLowerCase() })),
    }, { status: 201 });
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

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.address !== undefined) data.address = body.address;
    if (body.latitude !== undefined) data.latitude = body.latitude;
    if (body.longitude !== undefined) data.longitude = body.longitude;
    if (body.space_type !== undefined) data.spaceType = body.space_type.toUpperCase() as any;
    if (body.is_covered !== undefined) data.isCovered = body.is_covered;
    if (body.is_ev_charger !== undefined) data.isEvCharger = body.is_ev_charger;
    if (body.is_24_7 !== undefined) data.is247 = body.is_24_7;
    if (body.total_spots !== undefined) data.totalSpots = body.total_spots;
    if (body.available_spots !== undefined) data.availableSpots = body.available_spots;
    if (body.status !== undefined) data.status = body.status;

    const space = await prisma.parkingSpace.update({ where: { id }, data });

    if (body.pricing && Array.isArray(body.pricing)) {
      await prisma.parkingPrice.deleteMany({ where: { spaceId: id } });
      await prisma.parkingPrice.createMany({
        data: body.pricing
          .filter((p: any) => p.price > 0)
          .map((p: any) => ({ spaceId: id, rateType: (p.rate_type || "HOURLY").toUpperCase() as any, price: p.price })),
      });
    }

    return NextResponse.json(space);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.parkingSpace.delete({ where: { id } });
    return NextResponse.json({ message: "Space deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
