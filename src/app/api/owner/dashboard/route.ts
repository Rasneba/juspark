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
    if (!user || user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Unauthorized. Only owners can access this endpoint." },
        { status: 403 }
      );
    }

    const spaces = await prisma.parkingSpace.findMany({
      where: { hostId: user.userId },
      select: { id: true, totalSpots: true, availableSpots: true },
    });

    const spaceIds = spaces.map((s) => s.id);

    const earningsAgg = await prisma.booking.aggregate({
      where: {
        spaceId: { in: spaceIds },
        status: "COMPLETED",
      },
      _sum: { hostPayout: true },
    });
    const totalEarnings = earningsAgg._sum.hostPayout || 0;

    const pendingPayoutAgg = await prisma.booking.aggregate({
      where: {
        spaceId: { in: spaceIds },
        status: "CONFIRMED",
      },
      _sum: { hostPayout: true },
    });
    const pendingPayout = pendingPayoutAgg._sum.hostPayout || 0;

    const totalBookings = await prisma.booking.count({
      where: {
        spaceId: { in: spaceIds },
        status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] },
      },
    });

    const activeBookings = await prisma.booking.count({
      where: {
        spaceId: { in: spaceIds },
        status: { in: ["CONFIRMED", "ACTIVE"] },
      },
    });

    const completedBookings = await prisma.booking.count({
      where: {
        spaceId: { in: spaceIds },
        status: "COMPLETED",
      },
    });

    const totalSpots = spaces.reduce((sum, s) => sum + s.totalSpots, 0);
    const occupiedSpots = spaces.reduce(
      (sum, s) => sum + (s.totalSpots - s.availableSpots),
      0
    );
    const occupancyRate =
      totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

    const reviewStats = await prisma.review.aggregate({
      where: {
        spaceId: { in: spaceIds },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const recentBookings = await prisma.booking.findMany({
      where: {
        spaceId: { in: spaceIds },
      },
      include: {
        space: {
          select: { name: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await prisma.booking.count({
      where: {
        spaceId: { in: spaceIds },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayRevenue = await prisma.booking.aggregate({
      where: {
        spaceId: { in: spaceIds },
        status: "COMPLETED",
        checkoutTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { hostPayout: true },
    });

    return NextResponse.json({
      totalEarnings,
      pendingPayout,
      totalBookings,
      activeBookings,
      completedBookings,
      occupancyRate,
      averageRating: reviewStats._avg.rating || 0,
      totalReviews: reviewStats._count.rating,
      totalSpaces: spaces.length,
      totalSpots,
      todayBookings,
      todayRevenue: todayRevenue._sum.hostPayout || 0,
      recentBookings,
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
