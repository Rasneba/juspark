import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function clear() {
  await prisma.parkingPrice.deleteMany();
  await prisma.parkingImage.deleteMany();
  await prisma.parkingSpace.deleteMany();
  const count = await prisma.parkingSpace.count();
  console.log(`Cleared. Spaces remaining: ${count}`);
  await prisma.$disconnect();
}
clear();
