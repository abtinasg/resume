-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resumeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT,
    "data" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeScoreHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resumeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "change" INTEGER,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeScoreHistory_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResumeScoreHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExitFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "rating" INTEGER,
    "likelihoodToReturn" INTEGER,
    "reason" TEXT,
    "comment" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExitFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ResumeVersion_userId_createdAt_idx" ON "ResumeVersion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_version_idx" ON "ResumeVersion"("resumeId", "version");

-- CreateIndex
CREATE INDEX "ResumeScoreHistory_userId_recordedAt_idx" ON "ResumeScoreHistory"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "ResumeScoreHistory_resumeId_recordedAt_idx" ON "ResumeScoreHistory"("resumeId", "recordedAt");
