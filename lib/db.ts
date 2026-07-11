import { PrismaClient } from "@prisma/client";

// Serverless-safe singleton: avoids exhausting the pooled connection limit
// across Next.js dev hot-reloads and repeated serverless cold starts.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
