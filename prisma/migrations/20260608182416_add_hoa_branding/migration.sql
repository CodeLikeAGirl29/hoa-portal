/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `HOA` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lastModified` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `HOA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `HOA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_hoaId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "documentTitle" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileSize" TEXT,
ADD COLUMN     "isAccessibleToResidents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isMandatoryRecord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastModified" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pages" INTEGER,
ADD COLUMN     "requiresLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadedBy" TEXT;

-- AlterTable
ALTER TABLE "HOA" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#185FA5',
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'FL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zip" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "hoaId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "HOA_slug_key" ON "HOA"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hoaId_fkey" FOREIGN KEY ("hoaId") REFERENCES "HOA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
