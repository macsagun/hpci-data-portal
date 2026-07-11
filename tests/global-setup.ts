import { PrismaClient } from "@prisma/client";

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

// Resets the test database to a known state before the suite runs: clears
// every submission/pending/log row (test data only) and makes sure the 9
// known churches exist, without touching anything else that might be in the
// target database.
export default async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    await prisma.pendingWeek.deleteMany();
    await prisma.pendingChange.deleteMany();
    await prisma.submissionWeek.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.approvalLog.deleteMany();
    await prisma.loginAttempt.deleteMany();
    for (const name of CHURCHES) {
      await prisma.church.upsert({ where: { name }, update: {}, create: { name } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
