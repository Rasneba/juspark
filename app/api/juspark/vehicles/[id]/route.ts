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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.vehicle.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { plate_number, nickname, make, model, color, is_default } = await req.json();

    if (is_default) {
      await prisma.vehicle.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id, userId: user.id },
      data: {
        ...(plate_number !== undefined && { plateNumber: plate_number }),
        ...(nickname !== undefined && { nickname }),
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(color !== undefined && { color }),
        ...(is_default !== undefined && { isDefault: is_default }),
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
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
