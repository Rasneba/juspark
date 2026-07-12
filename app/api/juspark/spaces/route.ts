import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = { status: "ACTIVE" };
    if (type && type !== "all") {
      where.spaceType = type.toUpperCase() as any;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const result = await prisma.parkingSpace.findMany({
      where,
      include: {
        pricing: true,
        images: { where: { isPrimary: true }, take: 1 },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const spaces = result.map((r) => {
      const avgRating = r.reviews.length > 0
        ? r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length
        : 0;

      return {
        id: r.id,
        host_id: r.hostId,
        name: r.name,
        description: r.description,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        space_type: r.spaceType.toLowerCase(),
        is_covered: r.isCovered,
        is_ev_charger: r.isEvCharger,
        is_24_7: r.is247,
        height_limit: r.heightLimit,
        total_spots: r.totalSpots,
        available_spots: r.availableSpots,
        status: r.status,
        rating_avg: avgRating || r.ratingAvg,
        rating_count: r.reviews.length || r.ratingCount,
        primary_photo: r.primaryPhoto || r.images[0]?.url || null,
        photos: r.images.map((img) => img.url),
        host_name: r.hostName,
        pricing: r.pricing.map((p) => ({
          id: p.id,
          rate_type: p.rateType.toLowerCase(),
          price: p.price,
          min_duration: p.minDuration,
          max_duration: p.maxDuration,
        })),
        distance_km: lat && lng ? haversine(lat, lng, r.latitude, r.longitude) : null,
      };
    });

    if (lat && lng) {
      spaces.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    }

    return NextResponse.json(spaces);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
