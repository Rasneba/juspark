import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PARKme Ethiopia users...");
  const password = await bcrypt.hash("admin123", 10);

  // Update old emails to new ones
  await prisma.user.updateMany({ where: { email: "guest@juspark.et" }, data: { email: "guest@parkme.et" } });
  await prisma.user.updateMany({ where: { email: "host@juspark.et" }, data: { email: "host@parkme.et" } });

  // Upsert with new emails
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
  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
