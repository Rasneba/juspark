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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const where: any = {
      hostId: user.userId,
    };

    if (status && ["DRAFT", "ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    const [spaces, total] = await Promise.all([
      prisma.parkingSpace.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          pricing: true,
          _count: {
            select: {
              bookings: {
                where: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } },
              },
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.parkingSpace.count({ where }),
    ]);

    const spacesWithStats = await Promise.all(
      spaces.map(async (space) => {
        const earnings = await prisma.booking.aggregate({
          where: {
            spaceId: space.id,
            status: "COMPLETED",
          },
          _sum: {
            hostPayout: true,
          },
        });

        return {
          ...space,
          totalEarnings: earnings._sum.hostPayout || 0,
          bookingCount: space._count.bookings,
          reviewCount: space._count.reviews,
        };
      })
    );

    return NextResponse.json({
      spaces: spacesWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Owner listings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
