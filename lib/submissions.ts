import { prisma } from "./db";
import type { ParsedSubmission, Week } from "./types";
import type { Prisma } from "@prisma/client";

function toWeek(row: { date: Date; regulars: number; vip: number; giving: Prisma.Decimal; sermon: string; preacher: string }): Week {
  return {
    date: row.date.toISOString().slice(0, 10),
    regulars: row.regulars,
    vip: row.vip,
    giving: Number(row.giving),
    sermon: row.sermon,
    preacher: row.preacher,
  };
}

function weekCreateData(w: Week) {
  return {
    date: new Date(w.date + "T00:00:00Z"),
    regulars: w.regulars,
    vip: w.vip,
    giving: w.giving,
    sermon: w.sermon,
    preacher: w.preacher,
  };
}

export async function getChurches(): Promise<string[]> {
  const rows = await prisma.church.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r) => r.name);
}

export type LiveSubmission = ParsedSubmission & { id: string };

export async function getLiveSubmission(church: string, monthKey: string): Promise<LiveSubmission | null> {
  const row = await prisma.submission.findUnique({
    where: { church_monthKey: { church, monthKey } },
    include: { weeks: { orderBy: { date: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    church: row.church,
    monthKey: row.monthKey,
    weeks: row.weeks.map(toWeek),
    wins: row.wins,
    challenges: row.challenges,
  };
}

export type PendingRecord = ParsedSubmission & { id: string; isUpdate: boolean; submittedAt: Date };

export async function getPendingChange(church: string, monthKey: string): Promise<PendingRecord | null> {
  const row = await prisma.pendingChange.findUnique({
    where: { church_monthKey: { church, monthKey } },
    include: { weeks: { orderBy: { date: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    church: row.church,
    monthKey: row.monthKey,
    weeks: row.weeks.map(toWeek),
    wins: row.wins,
    challenges: row.challenges,
    isUpdate: row.isUpdate,
    submittedAt: row.submittedAt,
  };
}

export async function getMonthKeysWithData(): Promise<string[]> {
  const rows = await prisma.submission.findMany({
    select: { monthKey: true },
    distinct: ["monthKey"],
  });
  return rows.map((r) => r.monthKey).sort();
}

export type OverviewRow = {
  church: string;
  submission: LiveSubmission | null;
  hasPending: boolean;
};

export async function getOverviewData(monthKey: string): Promise<OverviewRow[]> {
  const churches = await getChurches();
  const [subs, pendings] = await Promise.all([
    prisma.submission.findMany({ where: { monthKey }, include: { weeks: { orderBy: { date: "asc" } } } }),
    prisma.pendingChange.findMany({ where: { monthKey }, select: { church: true } }),
  ]);
  const subByChurch = new Map(subs.map((s) => [s.church, s]));
  const pendingChurches = new Set(pendings.map((p) => p.church));

  return churches.map((church) => {
    const s = subByChurch.get(church);
    const submission: LiveSubmission | null = s
      ? {
          id: s.id,
          church: s.church,
          monthKey: s.monthKey,
          weeks: s.weeks.map(toWeek),
          wins: s.wins,
          challenges: s.challenges,
        }
      : null;
    return { church, submission, hasPending: pendingChurches.has(church) };
  });
}

export async function getTrendsData(): Promise<{ monthKeys: string[]; churches: string[]; submissionsByChurchAndMonth: Map<string, LiveSubmission> }> {
  const [churches, monthKeys, subs] = await Promise.all([
    getChurches(),
    getMonthKeysWithData(),
    prisma.submission.findMany({ include: { weeks: { orderBy: { date: "asc" } } } }),
  ]);
  const map = new Map<string, LiveSubmission>();
  for (const s of subs) {
    map.set(`${s.church}|${s.monthKey}`, {
      id: s.id,
      church: s.church,
      monthKey: s.monthKey,
      weeks: s.weeks.map(toWeek),
      wins: s.wins,
      challenges: s.challenges,
    });
  }
  return { monthKeys, churches, submissionsByChurchAndMonth: map };
}

export async function getChurchHistory(church: string): Promise<LiveSubmission[]> {
  const rows = await prisma.submission.findMany({
    where: { church },
    include: { weeks: { orderBy: { date: "asc" } } },
    orderBy: { monthKey: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    church: row.church,
    monthKey: row.monthKey,
    weeks: row.weeks.map(toWeek),
    wins: row.wins,
    challenges: row.challenges,
  }));
}

export type PendingListItem = {
  pending: PendingRecord;
  live: LiveSubmission | null;
};

export async function getPendingList(): Promise<PendingListItem[]> {
  const rows = await prisma.pendingChange.findMany({
    include: { weeks: { orderBy: { date: "asc" } } },
    orderBy: { submittedAt: "desc" },
  });
  const items: PendingListItem[] = [];
  for (const row of rows) {
    const pending: PendingRecord = {
      id: row.id,
      church: row.church,
      monthKey: row.monthKey,
      weeks: row.weeks.map(toWeek),
      wins: row.wins,
      challenges: row.challenges,
      isUpdate: row.isUpdate,
      submittedAt: row.submittedAt,
    };
    const live = row.isUpdate ? await getLiveSubmission(row.church, row.monthKey) : null;
    items.push({ pending, live });
  }
  return items;
}

export async function getPendingCount(): Promise<number> {
  return prisma.pendingChange.count();
}

/** Every submission (form or CSV) lands here first — never written directly to the live table. */
export async function routeSubmission(input: ParsedSubmission): Promise<void> {
  await prisma.church.upsert({
    where: { name: input.church },
    update: {},
    create: { name: input.church },
  });

  const existingLive = await prisma.submission.findUnique({
    where: { church_monthKey: { church: input.church, monthKey: input.monthKey } },
    select: { id: true },
  });
  const isUpdate = !!existingLive;

  await prisma.$transaction(async (tx) => {
    const existingPending = await tx.pendingChange.findUnique({
      where: { church_monthKey: { church: input.church, monthKey: input.monthKey } },
      select: { id: true },
    });

    const pending = existingPending
      ? await tx.pendingChange.update({
          where: { id: existingPending.id },
          data: { wins: input.wins, challenges: input.challenges, isUpdate, submittedAt: new Date() },
        })
      : await tx.pendingChange.create({
          data: {
            church: input.church,
            monthKey: input.monthKey,
            wins: input.wins,
            challenges: input.challenges,
            isUpdate,
          },
        });

    await tx.pendingWeek.deleteMany({ where: { pendingChangeId: pending.id } });
    await tx.pendingWeek.createMany({
      data: input.weeks.map((w) => ({ pendingChangeId: pending.id, ...weekCreateData(w) })),
    });
  });
}

export async function approvePending(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pending = await tx.pendingChange.findUnique({
      where: { id },
      include: { weeks: true },
    });
    if (!pending) return;

    const submission = await tx.submission.upsert({
      where: { church_monthKey: { church: pending.church, monthKey: pending.monthKey } },
      update: { wins: pending.wins, challenges: pending.challenges },
      create: {
        church: pending.church,
        monthKey: pending.monthKey,
        wins: pending.wins,
        challenges: pending.challenges,
      },
    });

    await tx.submissionWeek.deleteMany({ where: { submissionId: submission.id } });
    await tx.submissionWeek.createMany({
      data: pending.weeks.map((w) => ({
        submissionId: submission.id,
        date: w.date,
        regulars: w.regulars,
        vip: w.vip,
        giving: w.giving,
        sermon: w.sermon,
        preacher: w.preacher,
      })),
    });

    await tx.pendingChange.delete({ where: { id } });

    await tx.approvalLog.create({
      data: { church: pending.church, monthKey: pending.monthKey, action: "approve" },
    });
  });
}

export async function rejectPending(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pending = await tx.pendingChange.findUnique({ where: { id }, select: { church: true, monthKey: true } });
    if (!pending) return;

    await tx.pendingChange.delete({ where: { id } });

    await tx.approvalLog.create({
      data: { church: pending.church, monthKey: pending.monthKey, action: "reject" },
    });
  });
}

export type AuditLogEntry = {
  id: string;
  church: string;
  monthKey: string;
  action: string;
  actedAt: Date;
};

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  return prisma.approvalLog.findMany({ orderBy: { actedAt: "desc" } });
}
