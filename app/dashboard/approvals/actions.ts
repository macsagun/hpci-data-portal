"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { approvePending, rejectPending } from "@/lib/submissions";

// Defense in depth: the dashboard layout already gates rendering, but Server
// Actions are directly-reachable POST endpoints, so every mutation re-checks
// auth here regardless of how it was invoked.

export async function approvePendingAction(id: string): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  await approvePending(id);
  revalidatePath("/dashboard", "layout");
}

export async function rejectPendingAction(id: string): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
  await rejectPending(id);
  revalidatePath("/dashboard", "layout");
}
