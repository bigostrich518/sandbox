/*
  Warnings:

  - You are about to drop the `TargetDomain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `domainId` on the `CampaignObjective` table. All the data in the column will be lost.
  - Added the required column `campaignId` to the `CampaignObjective` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaignId` to the `Prompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaignId` to the `Recommendation` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TargetDomain";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "scrapedContent" TEXT,
    "pagesCrawled" INTEGER,
    "lastCrawledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CampaignObjective" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "CampaignObjective_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CampaignObjective" ("id", "text") SELECT "id", "text" FROM "CampaignObjective";
DROP TABLE "CampaignObjective";
ALTER TABLE "new_CampaignObjective" RENAME TO "CampaignObjective";
CREATE TABLE "new_Prompt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "Prompt_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("createdAt", "id", "text") SELECT "createdAt", "id", "text" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE TABLE "new_Recommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    CONSTRAINT "Recommendation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recommendation" ("content", "createdAt", "id") SELECT "content", "createdAt", "id" FROM "Recommendation";
DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
