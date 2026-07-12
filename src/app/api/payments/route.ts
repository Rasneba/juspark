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
    const { bookingId, amount, method } = body;

    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        { error: "bookingId, amount, and method are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only pay for your own bookings" },
        { status: 403 }
      );
    }

    if (booking.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment already completed for this booking" },
        { status: 409 }
      );
    }

    if (parseFloat(String(amount)) < parseFloat(String(booking.totalAmount))) {
      return NextResponse.json(
        {
          error: `Insufficient amount. Required: ${booking.totalAmount}`,
        },
        { status: 400 }
      );
    }

    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "COMPLETED",
        bookingRef: paymentRef,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      payment: {
        bookingId: updated.id,
        amount: parseFloat(String(amount)),
        method,
        providerRef: paymentRef,
        status: "COMPLETED",
      },
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Process payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
