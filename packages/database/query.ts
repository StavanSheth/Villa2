import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const villa = await prisma.villa.findFirst({
    where: { id: 'villa-1' }
  });
  console.log("VILLA NAME:", villa?.name);
}
main().catch(console.error).finally(() => prisma.$disconnect());
