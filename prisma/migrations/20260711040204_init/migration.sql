-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Church" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Church_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "church" TEXT NOT NULL,
    "monthKey" CHAR(7) NOT NULL,
    "wins" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionWeek" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "regulars" INTEGER NOT NULL,
    "vip" INTEGER NOT NULL,
    "giving" DECIMAL(12,2) NOT NULL,
    "sermon" TEXT NOT NULL,
    "preacher" TEXT NOT NULL DEFAULT '—',

    CONSTRAINT "SubmissionWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingChange" (
    "id" TEXT NOT NULL,
    "church" TEXT NOT NULL,
    "monthKey" CHAR(7) NOT NULL,
    "wins" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "isUpdate" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingWeek" (
    "id" TEXT NOT NULL,
    "pendingChangeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "regulars" INTEGER NOT NULL,
    "vip" INTEGER NOT NULL,
    "giving" DECIMAL(12,2) NOT NULL,
    "sermon" TEXT NOT NULL,
    "preacher" TEXT NOT NULL DEFAULT '—',

    CONSTRAINT "PendingWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "church" TEXT NOT NULL,
    "monthKey" CHAR(7) NOT NULL,
    "action" TEXT NOT NULL,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Church_name_key" ON "Church"("name");

-- CreateIndex
CREATE INDEX "Submission_monthKey_idx" ON "Submission"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_church_monthKey_key" ON "Submission"("church", "monthKey");

-- CreateIndex
CREATE INDEX "SubmissionWeek_submissionId_idx" ON "SubmissionWeek"("submissionId");

-- CreateIndex
CREATE INDEX "PendingChange_monthKey_idx" ON "PendingChange"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "PendingChange_church_monthKey_key" ON "PendingChange"("church", "monthKey");

-- CreateIndex
CREATE INDEX "PendingWeek_pendingChangeId_idx" ON "PendingWeek"("pendingChangeId");

-- AddForeignKey
ALTER TABLE "SubmissionWeek" ADD CONSTRAINT "SubmissionWeek_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingWeek" ADD CONSTRAINT "PendingWeek_pendingChangeId_fkey" FOREIGN KEY ("pendingChangeId") REFERENCES "PendingChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

