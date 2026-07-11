import { test, expect } from "@playwright/test";
import { validateWeekForm } from "../lib/validation";
import { parseCSV, sampleText } from "../lib/csv";
import { routeSubmission } from "../lib/submissions";
import { prisma } from "../lib/db";

// Pure logic + DB-layer edge cases found during a pre-launch audit — no
// browser needed, these call the validation/parsing/data-access functions
// directly. Regression coverage for bugs that were silently corrupting data
// or crashing the app on ordinary (non-malicious) input before the fix.

test.describe("numeric edge cases", () => {
  test("decimal regulars is rejected, not silently truncated", async () => {
    const r = validateWeekForm({
      church: "HPCI North Caloocan",
      year: "2026",
      month: "6",
      values: { "2026-06-07": { regulars: "12.5", vip: "3", giving: "1000", sermon: "Test" } },
      wins: "win",
      challenges: "challenge",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("whole number"))).toBe(true);
  });

  test("absurdly large regulars is rejected, not left to crash Prisma", async () => {
    const r = validateWeekForm({
      church: "HPCI North Caloocan",
      year: "2026",
      month: "6",
      values: { "2026-06-07": { regulars: "999999999999999999999", vip: "3", giving: "1000", sermon: "Test" } },
      wins: "win",
      challenges: "challenge",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("too large"))).toBe(true);
  });

  test("valid whole-number submission still passes (no false positive)", async () => {
    const r = validateWeekForm({
      church: "HPCI North Caloocan",
      year: "2026",
      month: "6",
      values: { "2026-06-07": { regulars: "120", vip: "8", giving: "45000.50", sermon: "Test", preacher: "Ptr. Test" } },
      wins: "win",
      challenges: "challenge",
    });
    expect(r.ok).toBe(true);
  });
});

function csvWithWeekRow(row: string): string {
  return `His Presence Church International - Monthly Local Church Report

Church Name:,HPCI Saturate
Report Month:,June 2026

WEEKLY DATA
Sunday Date,Regulars,First Timers (VIP),Tithes & Offering (PHP),Sermon Title,Preacher
${row}

WINS
"some win"

CHALLENGES
"some challenge"
`;
}

test.describe("CSV date edge cases", () => {
  test("invalid calendar date (month 13, day 45) is rejected", async () => {
    const r = parseCSV(csvWithWeekRow("2026-13-45,100,5,10000,Test Sermon,Ptr. Test"));
    expect(r.ok).toBe(false);
  });

  test("a date that isn't a Sunday is rejected", async () => {
    const r = parseCSV(csvWithWeekRow("2026-06-08,100,5,10000,Test Sermon,Ptr. Test")); // Monday
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("not a Sunday"))).toBe(true);
  });

  test("a date outside the claimed report month is rejected", async () => {
    const r = parseCSV(csvWithWeekRow("2026-07-05,100,5,10000,Test Sermon,Ptr. Test")); // July date, June report
    expect(r.ok).toBe(false);
  });

  test("duplicate Sunday dates in the same file are rejected", async () => {
    const csv = csvWithWeekRow("2026-06-07,100,5,10000,Test Sermon,Ptr. Test\n2026-06-07,200,9,20000,Another,Ptr. Other");
    const r = parseCSV(csv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("more than once"))).toBe(true);
  });

  test("decimal regulars in a CSV row is rejected", async () => {
    const r = parseCSV(csvWithWeekRow("2026-06-07,100.5,5,10000,Test Sermon,Ptr. Test"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("whole number"))).toBe(true);
  });

  test("a blank sermon title in a CSV row is rejected", async () => {
    const r = parseCSV(csvWithWeekRow("2026-06-07,100,5,10000,,Ptr. Test"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("sermon title"))).toBe(true);
  });

  test("a whitespace-only sermon title in a CSV row is rejected", async () => {
    const r = parseCSV(csvWithWeekRow('2026-06-07,100,5,10000,"   ",Ptr. Test'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("sermon title"))).toBe(true);
  });

  test("a well-formed CSV still parses correctly (no false positives)", async () => {
    const r = parseCSV(sampleText());
    expect(r.ok).toBe(true);
  });

  test("a CSV saved with a UTF-8 BOM (common from Excel) still parses", async () => {
    const r = parseCSV("﻿" + sampleText());
    expect(r.ok).toBe(true);
  });
});

test.describe("church name resolution", () => {
  test("a case-different church name resolves to the existing church, not a duplicate", async () => {
    const beforeCount = await prisma.church.count();
    const csv = sampleText().replace("HPCI Johanan", "hpci johanan");
    const r = parseCSV(csv);
    expect(r.ok).toBe(true);
    if (r.ok) await routeSubmission(r.data);

    const afterCount = await prisma.church.count();
    expect(afterCount).toBe(beforeCount);

    const pending = await prisma.pendingChange.findFirst({ where: { church: "HPCI Johanan", monthKey: "2026-06" } });
    expect(pending).not.toBeNull();

    // cleanup so this test is repeatable
    if (pending) {
      await prisma.pendingWeek.deleteMany({ where: { pendingChangeId: pending.id } });
      await prisma.pendingChange.delete({ where: { id: pending.id } });
    }
  });
});

test.describe("passphrase rate limiting", () => {
  // Local test traffic has no real client IP, so every login in this whole
  // suite shares one rate-limit bucket ("unknown"). This block deliberately
  // exhausts it, so it MUST run last and MUST clear LoginAttempt afterwards —
  // otherwise every other test's login would start seeing the lockout too.
  test.afterAll(async () => {
    await prisma.loginAttempt.deleteMany();
  });

  test("3 wrong passphrases lock out further attempts, even the correct one", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Admin access only")).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await page.fill("input[placeholder='Passphrase']", `definitely-wrong-${i}`);
      await page.click("button:has-text('Unlock dashboard')");
      await expect(page.getByText(/Incorrect passphrase|Too many wrong attempts/)).toBeVisible({ timeout: 10_000 });
    }

    // 4th attempt uses the REAL passphrase — should still be blocked by the lockout.
    const realPassphrase = process.env.HPCI_ADMIN_PASSPHRASE ?? "hpci-pastors-2026";
    await page.fill("input[placeholder='Passphrase']", realPassphrase);
    await page.click("button:has-text('Unlock dashboard')");
    await expect(page.getByText(/Too many wrong attempts/)).toBeVisible({ timeout: 10_000 });
    expect(page.url()).not.toContain("/dashboard/overview");
  });
});
