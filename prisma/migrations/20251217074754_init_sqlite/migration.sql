-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "startups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "founder" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Onboarded',
    "onboardedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graduatedDate" DATETIME,
    "description" TEXT,
    "website" TEXT,
    "fundingReceived" REAL DEFAULT 0,
    "employeeCount" INTEGER DEFAULT 0,
    "revenueGenerated" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dpiitNo" TEXT,
    "recognitionDate" DATETIME,
    "bhaskarId" TEXT
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaUrl" TEXT,
    "isGraduated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "achievements_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startupId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "progress_history_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "one_on_one_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mentor" TEXT,
    "topic" TEXT,
    "notes" TEXT,
    "actionItems" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "one_on_one_meetings_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "smc_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "agenda" TEXT,
    "decisions" TEXT,
    "attendees" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "smc_meetings_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agreements_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "achievements_startupId_idx" ON "achievements"("startupId");

-- CreateIndex
CREATE INDEX "progress_history_startupId_idx" ON "progress_history"("startupId");

-- CreateIndex
CREATE INDEX "one_on_one_meetings_startupId_idx" ON "one_on_one_meetings"("startupId");

-- CreateIndex
CREATE INDEX "smc_meetings_startupId_idx" ON "smc_meetings"("startupId");

-- CreateIndex
CREATE INDEX "agreements_startupId_idx" ON "agreements"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
