"use server";

import { redirect } from "next/navigation";
import { checkPassphrase, createSession, destroySession } from "@/lib/auth";

export type LoginState = { error: boolean };

export async function checkPassphraseAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const input = String(formData.get("passphrase") ?? "");
  if (!checkPassphrase(input)) {
    return { error: true };
  }
  await createSession();
  redirect("/dashboard/overview");
}

export async function lockAction(): Promise<void> {
  await destroySession();
  redirect("/submit");
}
