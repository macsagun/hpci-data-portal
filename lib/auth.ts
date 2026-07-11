import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { timingSafeEqual } from "node:crypto";

type SessionData = {
  unlocked?: boolean;
};

const TWELVE_HOURS = 60 * 60 * 12;

function sessionOptions(): SessionOptions {
  const password = process.env.HPCI_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("HPCI_SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  return {
    password,
    cookieName: "hpci_session",
    ttl: TWELVE_HOURS,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
  };
}

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.unlocked === true;
}

export function checkPassphrase(input: string): boolean {
  const expected = process.env.HPCI_ADMIN_PASSPHRASE ?? "";
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const session = await getSession();
  session.unlocked = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
