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

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { spaceId, bookingId, rating, comment } = body;

    if (!spaceId || rating == null) {
      return NextResponse.json(
        { error: "spaceId and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const space = await prisma.parkingSpace.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found" },
        { status: 404 }
      );
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      if (booking.userId !== user.userId) {
        return NextResponse.json(
          { error: "You can only review your own bookings" },
          { status: 403 }
        );
      }

      if (booking.status !== "COMPLETED") {
        return NextResponse.json(
          { error: "You can only review completed bookings" },
          { status: 400 }
        );
      }

      const existingReview = await prisma.review.findUnique({
        where: { bookingId },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this booking" },
          { status: 409 }
        );
      }
    }

    const existingByUserSpace = await prisma.review.findFirst({
      where: {
        userId: user.userId,
        spaceId,
        bookingId: null,
      },
    });

    if (existingByUserSpace && !bookingId) {
      return NextResponse.json(
        { error: "You have already reviewed this parking space" },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        spaceId,
        userId: user.userId,
        bookingId: bookingId || null,
        rating: parseInt(String(rating)),
        comment: comment || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const stats = await prisma.review.aggregate({
      where: { spaceId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.parkingSpace.update({
      where: { id: spaceId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!spaceId) {
      return NextResponse.json(
        { error: "spaceId is required" },
        { status: 400 }
      );
    }

    const where = { spaceId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
