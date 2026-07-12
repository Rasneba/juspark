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

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(vehicles.map((v) => ({
      id: v.id,
      user_id: v.userId,
      plate_number: v.plateNumber,
      nickname: v.nickname,
      make: v.make,
      model: v.model,
      color: v.color,
      is_default: v.isDefault,
      created_at: v.createdAt,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plate_number, nickname, make, model, color } = await req.json();
    if (!plate_number?.trim()) return NextResponse.json({ error: "Plate number is required" }, { status: 400 });

    const existing = await prisma.vehicle.count({ where: { userId: user.id } });
    const is_default = existing === 0;

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        plateNumber: plate_number.trim().toUpperCase(),
        nickname: nickname || null,
        make: make || null,
        model: model || null,
        color: color || null,
        isDefault: is_default,
      },
    });

    return NextResponse.json({
      id: vehicle.id,
      user_id: vehicle.userId,
      plate_number: vehicle.plateNumber,
      nickname: vehicle.nickname,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      is_default: vehicle.isDefault,
      created_at: vehicle.createdAt,
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
