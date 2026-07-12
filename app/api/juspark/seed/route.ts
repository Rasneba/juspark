import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const SPACES = [
  { name: "Bole Medhanealem Parking", description: "Covered parking near Medhanealem Cathedral. Safe and well-lit 24/7.", address: "Bole Road, near Medhanealem Cathedral, Addis Ababa", latitude: 9.0127, longitude: 38.7631, spaceType: "GARAGE", isCovered: true, isEvCharger: false, is247: true, totalSpots: 45, pricing: [{ rateType: "HOURLY", price: 30 }, { rateType: "DAILY", price: 200 }, { rateType: "MONTHLY", price: 3500 }] },
  { name: "Piassa Public Lot", description: "Open-air parking lot in the heart of Piassa.", address: "Piassa, Churchill Avenue, Addis Ababa", latitude: 9.0345, longitude: 38.7512, spaceType: "LOT", isCovered: false, isEvCharger: false, is247: false, totalSpots: 60, pricing: [{ rateType: "HOURLY", price: 15 }, { rateType: "DAILY", price: 100 }] },
  { name: "Megenagna Tower Parking", description: "Multi-level covered parking. CCTV monitored.", address: "Megenagna, Ring Road, Addis Ababa", latitude: 9.0127, longitude: 38.7825, spaceType: "GARAGE", isCovered: true, isEvCharger: true, is247: true, totalSpots: 120, pricing: [{ rateType: "HOURLY", price: 40 }, { rateType: "DAILY", price: 250 }, { rateType: "MONTHLY", price: 4500 }] },
  { name: "Arat Kilo Street Parking", description: "Street-side parking near Arat Kilo square.", address: "Arat Kilo, Addis Ababa", latitude: 9.0374, longitude: 38.7597, spaceType: "STREET", isCovered: false, isEvCharger: false, is247: false, totalSpots: 20, pricing: [{ rateType: "HOURLY", price: 10 }] },
  { name: "Kazanchis Business Center Garage", description: "Underground garage. Reserved parking available.", address: "Kazanchis, Addis Ababa", latitude: 9.0204, longitude: 38.7689, spaceType: "GARAGE", isCovered: true, isEvCharger: false, is247: true, totalSpots: 80, pricing: [{ rateType: "HOURLY", price: 35 }, { rateType: "DAILY", price: 220 }, { rateType: "MONTHLY", price: 4000 }] },
  { name: "Bole Medhanalem Driveway Spot", description: "Private driveway parking near Edna Mall.", address: "Bole Road, near Edna Mall, Addis Ababa", latitude: 9.0078, longitude: 38.7663, spaceType: "DRIVEWAY", isCovered: true, isEvCharger: false, is247: false, totalSpots: 3, pricing: [{ rateType: "HOURLY", price: 25 }, { rateType: "DAILY", price: 150 }] },
  { name: "Merkato Open Lot", description: "Large open parking near Merkato.", address: "Merkato, Addis Ababa", latitude: 9.0165, longitude: 38.7421, spaceType: "LOT", isCovered: false, isEvCharger: false, is247: false, totalSpots: 100, pricing: [{ rateType: "HOURLY", price: 10 }, { rateType: "DAILY", price: 80 }] },
  { name: "Bole Rwanda EV Charging Garage", description: "Modern covered garage with EV chargers.", address: "Bole Rwanda, Addis Ababa", latitude: 8.9944, longitude: 38.7765, spaceType: "GARAGE", isCovered: true, isEvCharger: true, is247: true, totalSpots: 30, pricing: [{ rateType: "HOURLY", price: 50 }, { rateType: "DAILY", price: 300 }, { rateType: "MONTHLY", price: 5000 }] },
  { name: "Lege Tafo Lot", description: "Affordable lot near Lege Tafo intersection.", address: "Lege Tafo, Addis Ababa", latitude: 9.0401, longitude: 38.7450, spaceType: "LOT", isCovered: false, isEvCharger: false, is247: false, totalSpots: 40, pricing: [{ rateType: "HOURLY", price: 10 }, { rateType: "DAILY", price: 70 }] },
  { name: "Meskel Square Street Parking", description: "Prime street parking next to Meskel Square.", address: "Meskel Square, Addis Ababa", latitude: 9.0113, longitude: 38.7610, spaceType: "STREET", isCovered: false, isEvCharger: false, is247: false, totalSpots: 15, pricing: [{ rateType: "HOURLY", price: 20 }] },
  { name: "Sar Betagna Covered Lot", description: "Covered parking. Security guard on duty.", address: "Sar Betagna, Addis Ababa", latitude: 9.0280, longitude: 38.7530, spaceType: "LOT", isCovered: true, isEvCharger: false, is247: false, totalSpots: 25, pricing: [{ rateType: "HOURLY", price: 20 }, { rateType: "DAILY", price: 130 }] },
  { name: "Ayat Real Estate Driveway", description: "Residential driveway space. Quiet neighborhood.", address: "Ayat, Addis Ababa", latitude: 9.0240, longitude: 38.7900, spaceType: "DRIVEWAY", isCovered: false, isEvCharger: false, is247: true, totalSpots: 2, pricing: [{ rateType: "HOURLY", price: 15 }, { rateType: "DAILY", price: 100 }, { rateType: "MONTHLY", price: 2000 }] },
];

export async function POST() {
  try {
    const bcrypt = await import("bcryptjs");
    const password = await bcrypt.hash("admin123", 10);

    const host = await prisma.user.upsert({
      where: { email: "host@juspark.et" },
      update: {},
      create: { email: "host@juspark.et", name: "Host User", passwordHash: password, role: "OWNER", isHost: true, isVerified: true },
    });

    await prisma.user.upsert({
      where: { email: "guest@juspark.et" },
      update: {},
      create: { email: "guest@juspark.et", name: "Guest User", passwordHash: password, role: "DRIVER", isHost: false, isVerified: true },
    });

    const existing = await prisma.parkingSpace.count({ where: { hostId: host.id } });
    if (existing > 0) {
      return NextResponse.json({ message: "Already seeded", count: existing });
    }

    let created = 0;
    for (const space of SPACES) {
      await prisma.parkingSpace.create({
        data: {
          hostId: host.id,
          hostName: host.name,
          name: space.name,
          description: space.description,
          address: space.address,
          latitude: space.latitude,
          longitude: space.longitude,
          spaceType: space.spaceType,
          isCovered: space.isCovered,
          isEvCharger: space.isEvCharger,
          is247: space.is247,
          totalSpots: space.totalSpots,
          availableSpots: space.totalSpots,
          status: "active",
          pricing: { create: space.pricing },
        },
      });
      created++;
    }

    return NextResponse.json({
      message: `Seeded ${created} spaces + 2 test users`,
      users: [
        { email: "guest@juspark.et", password: "admin123", role: "Guest/Driver" },
        { email: "host@juspark.et", password: "admin123", role: "Host" },
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.parkingPrice.deleteMany();
    await prisma.parkingImage.deleteMany();
    await prisma.parkingSpace.deleteMany();
    return NextResponse.json({ message: "All spaces deleted. Call POST to re-seed." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
