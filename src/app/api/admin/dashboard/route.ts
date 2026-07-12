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
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalDrivers,
      totalOwners,
      totalSpaces,
      activeSpaces,
      pendingSpaces,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      revenueAgg,
      pendingVerifications,
      recentBookings,
      recentUsers,
      bookingsByDay,
      topSpaces,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.user.count({ where: { role: "OWNER" } }),
      prisma.parkingSpace.count(),
      prisma.parkingSpace.count({ where: { status: "ACTIVE" } }),
      prisma.parkingSpace.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true, platformFee: true },
      }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          space: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
        },
      }),
      prisma.parkingSpace.findMany({
        where: { status: "ACTIVE" },
        include: {
          _count: { select: { bookings: true } },
        },
        orderBy: {
          bookings: { _count: "desc" },
        },
        take: 10,
      }),
    ]);

    const revenueByDay: Record<string, number> = {};
    const bookingsByDayCount: Record<string, number> = {};
    for (const booking of recentBookings) {
      const dateKey = booking.createdAt.toISOString().split("T")[0];
      bookingsByDayCount[dateKey] = (bookingsByDayCount[dateKey] || 0) + 1;
    }

    for (const entry of bookingsByDay) {
      const dateKey = entry.createdAt.toISOString().split("T")[0];
      if (entry.status === "COMPLETED") {
        revenueByDay[dateKey] =
          (revenueByDay[dateKey] || 0) + (entry.totalAmount || 0);
      }
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        drivers: totalDrivers,
        owners: totalOwners,
        pendingVerifications,
      },
      spaces: {
        total: totalSpaces,
        active: activeSpaces,
        pendingVerification: pendingSpaces,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      revenue: {
        total: revenueAgg._sum.totalAmount || 0,
        platformFees: revenueAgg._sum.platformFee || 0,
      },
      recentBookings,
      recentUsers,
      bookingsByDay: bookingsByDayCount,
      revenueByDay,
      topSpaces: topSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        bookingCount: s._count.bookings,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
