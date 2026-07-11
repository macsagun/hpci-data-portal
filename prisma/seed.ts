import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHURCHES = [
  "HPCI North Caloocan",
  "HPCI Saturate",
  "HPCI Cornerstone",
  "HPCI Thrive",
  "HPCI LifeHouse",
  "HPCI Maluid",
  "HPCI Agape",
  "HPCI Johanan",
  "HPCI Valenzuela",
];

async function main() {
  for (const name of CHURCHES) {
    await prisma.church.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${CHURCHES.length} churches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
