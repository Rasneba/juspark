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

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = parseFloat(searchParams.get("radius") || "10");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE",
    };

    if (type && ["LOT", "GARAGE", "DRIVEWAY", "STREET"].includes(type)) {
      where.spaceType = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (minPrice || maxPrice) {
      where.pricing = {
        some: {
          AND: [
            minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
            maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
          ],
        },
      };
    }

    let spaces = await prisma.parkingSpace.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        pricing: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      spaces = spaces
        .map((space) => ({
          ...space,
          _distance: haversineDistance(latitude, longitude, space.latitude, space.longitude),
        }))
        .filter((space) => space._distance <= radius)
        .sort((a, b) => a._distance - b._distance);
    }

    const total = spaces.length;

    return NextResponse.json({ spaces, total, page, limit });
  } catch (error) {
    console.error("Get parking spaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Unauthorized. Only owners can create parking spaces." },
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
      is247,
      heightLimit,
      images,
      pricing,
    } = body;

    if (!name || !address || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Name, address, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    if (!totalSpots || totalSpots < 1) {
      return NextResponse.json(
        { error: "Total spots must be at least 1" },
        { status: 400 }
      );
    }

    const space = await prisma.parkingSpace.create({
      data: {
        hostId: user.userId,
        name,
        description: description || null,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        spaceType: spaceType || "LOT",
        totalSpots: parseInt(totalSpots),
        availableSpots: parseInt(totalSpots),
        is247: is247 || false,
        heightLimit: heightLimit ? parseFloat(heightLimit) : null,
        status: "PENDING_VERIFICATION",
        images: images
          ? {
              create: images.map((img: any, index: number) => ({
                url: img.url,
                isPrimary: img.isPrimary || index === 0,
                sortOrder: img.sortOrder ?? index,
              })),
            }
          : undefined,
        pricing: pricing
          ? {
              create: pricing.map((p: any) => ({
                rateType: p.rateType || "HOURLY",
                price: parseFloat(p.price),
                minDuration: p.minDuration ? parseInt(p.minDuration) : null,
                maxDuration: p.maxDuration ? parseInt(p.maxDuration) : null,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        pricing: true,
      },
    });

    return NextResponse.json({ space }, { status: 201 });
  } catch (error) {
    console.error("Create parking space error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
