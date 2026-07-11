"use server";

import { redirect } from "next/navigation";
import { checkPassphrase, createSession, destroySession } from "@/lib/auth";
import { checkRateLimit, clearFailedAttempts, recordFailedAttempt } from "@/lib/rateLimit";

export type LoginState = { error: boolean; message?: string };

export async function checkPassphraseAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.allowed) {
    const unit = rateLimit.retryAfterMinutes === 1 ? "minute" : "minutes";
    return { error: true, message: `Too many wrong attempts. Try again in ${rateLimit.retryAfterMinutes} ${unit}.` };
  }

  const input = String(formData.get("passphrase") ?? "");
  if (!checkPassphrase(input)) {
    await recordFailedAttempt();
    return { error: true };
  }
  await clearFailedAttempts();
  await createSession();
  redirect("/dashboard/overview");
}

export async function lockAction(): Promise<void> {
  await destroySession();
  redirect("/submit");
}
