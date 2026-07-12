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

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        role: true, isHost: true, isVerified: true, createdAt: true,
        _count: { select: { bookings: true, vehicles: true, reviews: true } },
      },
    });

    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      avatar: profile.avatar,
      role: profile.role,
      is_host: profile.isHost,
      is_verified: profile.isVerified,
      created_at: profile.createdAt,
      stats: {
        bookings: profile._count.bookings,
        vehicles: profile._count.vehicles,
        reviews: profile._count.reviews,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.is_host !== undefined) data.isHost = body.is_host;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isHost: true },
    });

    return NextResponse.json({
      ...updated,
      is_host: updated.isHost,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
