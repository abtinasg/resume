-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "currentRole" TEXT,
    "targetRoles" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "currentLocation" TEXT,
    "targetLocations" TEXT NOT NULL,
    "workAuthorization" TEXT,
    "remoteOnly" BOOLEAN NOT NULL DEFAULT 0,
    "companySizePrefs" TEXT NOT NULL,
    "industries" TEXT NOT NULL,
    "salaryExpectation" TEXT,
    "currentStrategyMode" TEXT NOT NULL DEFAULT 'IMPROVE_RESUME_FIRST',
    "weeklyAppTarget" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "overallScore" INTEGER,
    "sectionScores" TEXT,
    "improvementAreas" TEXT NOT NULL,
    "targetRoles" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT NOT NULL,
    "description" TEXT,
    "seniorityLevel" TEXT,
    "requiredSkills" TEXT NOT NULL,
    "remoteOption" BOOLEAN NOT NULL DEFAULT 0,
    "salaryRange" TEXT,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'user_provided',
    "discoveredViaQuery" TEXT,
    "matchScore" INTEGER,
    "matchReasoning" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "appliedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverLetterUsed" TEXT,
    "outreachSent" BOOLEAN NOT NULL DEFAULT 0,
    "outreachMessage" TEXT,
    "lastFollowUp" DATETIME,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "outcome" TEXT,
    "outcomeDate" DATETIME,
    "outcomeNotes" TEXT,
    "strategyModeAtApply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion" ("id") ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InteractionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT NOT NULL,
    "sessionId" TEXT,
    "metadata" TEXT,
    CONSTRAINT "InteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "strategyMode" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" DATETIME,
    "reason" TEXT NOT NULL,
    "metricsAtStart" TEXT NOT NULL,
    "metricsAtEnd" TEXT,
    "applicationsInMode" INTEGER NOT NULL DEFAULT 0,
    "interviewsInMode" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StrategyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "ResumeVersion_userId_isMaster_idx" ON "ResumeVersion"("userId", "isMaster");

-- CreateIndex
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");

-- CreateIndex
CREATE INDEX "Application_userId_appliedAt_idx" ON "Application"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "Application_userId_lastFollowUp_idx" ON "Application"("userId", "lastFollowUp");

-- CreateIndex
CREATE INDEX "InteractionEvent_userId_timestamp_idx" ON "InteractionEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "InteractionEvent_userId_eventType_timestamp_idx" ON "InteractionEvent"("userId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "StrategyHistory_userId_deactivatedAt_idx" ON "StrategyHistory"("userId", "deactivatedAt");
