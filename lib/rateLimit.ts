import { headers } from "next/headers";
import { prisma } from "./db";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type RateLimitStatus = { allowed: true } | { allowed: false; retryAfterMinutes: number };

/** Checked before even looking at the submitted passphrase. */
export async function checkRateLimit(): Promise<RateLimitStatus> {
  const ip = await getClientIp();
  const record = await prisma.loginAttempt.findUnique({ where: { ip } });
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    const retryAfterMinutes = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60_000);
    return { allowed: false, retryAfterMinutes };
  }
  return { allowed: true };
}

/** Call on a wrong passphrase. Locks the IP out for LOCKOUT_MS after MAX_ATTEMPTS
 * consecutive failures; a failure after a previous lockout has expired starts a
 * fresh count rather than re-locking instantly. */
export async function recordFailedAttempt(): Promise<void> {
  const ip = await getClientIp();
  const record = await prisma.loginAttempt.findUnique({ where: { ip } });
  const lockoutExpired = !!record?.lockedUntil && record.lockedUntil <= new Date();
  const failCount = !record || lockoutExpired ? 1 : record.failCount + 1;
  const lockedUntil = failCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;

  await prisma.loginAttempt.upsert({
    where: { ip },
    update: { failCount, lockedUntil },
    create: { ip, failCount, lockedUntil },
  });
}

/** Call on a correct passphrase, so early typos don't count against a legitimate admin later. */
export async function clearFailedAttempts(): Promise<void> {
  const ip = await getClientIp();
  await prisma.loginAttempt.deleteMany({ where: { ip } });
}
