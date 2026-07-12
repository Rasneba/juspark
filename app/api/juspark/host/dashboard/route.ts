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

export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [earnings, spaces, bookings, reviews] = await Promise.all([
      prisma.booking.aggregate({
        where: { space: { hostId: user.id }, status: { in: ["COMPLETED", "ACTIVE"] as any } },
        _sum: { totalAmount: true },
      }),
      prisma.parkingSpace.count({ where: { hostId: user.id } }),
      prisma.booking.count({ where: { space: { hostId: user.id } } }),
      prisma.review.aggregate({
        where: { space: { hostId: user.id } },
        _avg: { rating: true },
      }),
    ]);

    const pendingPayout = await prisma.booking.aggregate({
      where: { space: { hostId: user.id }, paymentStatus: "PENDING" as any, status: { in: ["COMPLETED", "ACTIVE"] as any } },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      total_earnings: (earnings._sum.totalAmount || 0) * 0.85,
      pending_payout: (pendingPayout._sum.totalAmount || 0) * 0.85,
      total_spaces: spaces,
      total_bookings: bookings,
      average_rating: reviews._avg.rating || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
