import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SPACES = [
  { name: "Bole Medhanealem Parking", description: "Covered parking near Medhanealem Cathedral.", address: "Bole Road, near Medhanealem Cathedral, Addis Ababa", latitude: 9.0127, longitude: 38.7631, spaceType: "GARAGE", isCovered: true, is247: true, totalSpots: 45, pricing: [{ rateType: "HOURLY", price: 30 }, { rateType: "DAILY", price: 200 }] },
  { name: "Piassa Public Lot", description: "Open-air parking lot in Piassa.", address: "Piassa, Churchill Avenue, Addis Ababa", latitude: 9.0345, longitude: 38.7512, spaceType: "LOT", totalSpots: 60, pricing: [{ rateType: "HOURLY", price: 15 }, { rateType: "DAILY", price: 100 }] },
  { name: "Megenagna Tower Parking", description: "Multi-level covered parking. CCTV.", address: "Megenagna, Ring Road, Addis Ababa", latitude: 9.0127, longitude: 38.7825, spaceType: "GARAGE", isCovered: true, isEvCharger: true, is247: true, totalSpots: 120, pricing: [{ rateType: "HOURLY", price: 40 }, { rateType: "DAILY", price: 250 }] },
  { name: "Arat Kilo Street Parking", description: "Street-side parking near Arat Kilo.", address: "Arat Kilo, Addis Ababa", latitude: 9.0374, longitude: 38.7597, spaceType: "STREET", totalSpots: 20, pricing: [{ rateType: "HOURLY", price: 10 }] },
  { name: "Kazanchis Business Center Garage", description: "Underground garage.", address: "Kazanchis, Addis Ababa", latitude: 9.0204, longitude: 38.7689, spaceType: "GARAGE", isCovered: true, is247: true, totalSpots: 80, pricing: [{ rateType: "HOURLY", price: 35 }, { rateType: "DAILY", price: 220 }] },
  { name: "Merkato Open Lot", description: "Large open parking near Merkato.", address: "Merkato, Addis Ababa", latitude: 9.0165, longitude: 38.7421, spaceType: "LOT", totalSpots: 100, pricing: [{ rateType: "HOURLY", price: 10 }, { rateType: "DAILY", price: 80 }] },
  { name: "Bole Rwanda EV Charging Garage", description: "Modern garage with EV chargers.", address: "Bole Rwanda, Addis Ababa", latitude: 8.9944, longitude: 38.7765, spaceType: "GARAGE", isCovered: true, isEvCharger: true, is247: true, totalSpots: 30, pricing: [{ rateType: "HOURLY", price: 50 }, { rateType: "DAILY", price: 300 }] },
  { name: "Meskel Square Street Parking", description: "Prime street parking.", address: "Meskel Square, Addis Ababa", latitude: 9.0113, longitude: 38.7610, spaceType: "STREET", totalSpots: 15, pricing: [{ rateType: "HOURLY", price: 20 }] },
];

async function main() {
  console.log("Seeding...");
  const password = await bcrypt.hash("admin123", 10);

  const host = await prisma.user.upsert({
    where: { email: "host@parkme.et" },
    update: {},
    create: { email: "host@parkme.et", name: "Host User", passwordHash: password, role: "OWNER", isHost: true, isVerified: true },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@parkme.et" },
    update: {},
    create: { email: "guest@parkme.et", name: "Guest User", passwordHash: password, role: "DRIVER", isHost: false, isVerified: true },
  });

  console.log("Host:", host.email, "| Guest:", guest.email, "| Password: admin123");

  const count = await prisma.parkingSpace.count();
  if (count > 0) {
    console.log(`${count} spaces exist. Done.`);
    return;
  }

  for (const s of SPACES) {
    await prisma.parkingSpace.create({
      data: {
        hostId: host.id,
        hostName: host.name,
        name: s.name,
        description: s.description,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        spaceType: s.spaceType,
        isCovered: s.isCovered || false,
        isEvCharger: s.isEvCharger || false,
        is247: s.is247 || false,
        totalSpots: s.totalSpots,
        availableSpots: s.totalSpots,
        status: "active",
        pricing: { create: s.pricing },
      },
    });
  }

  console.log(`Seeded ${SPACES.length} parking spaces`);
  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
