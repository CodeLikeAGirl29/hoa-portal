-- Adds the Announcement table, which exists in schema.prisma but was never
-- included in a migration (cause of: relation "public.Announcement" does not
-- exist), plus lookup indexes for the queries the app runs on every page.
--
-- Every statement is idempotent so this is safe to run against a database
-- where the table was already created by hand or with `prisma db push`.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "hoaId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Announcement_hoaId_fkey'
    ) THEN
        ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_hoaId_fkey"
            FOREIGN KEY ("hoaId") REFERENCES "HOA"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Announcement_authorId_fkey'
    ) THEN
        ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey"
            FOREIGN KEY ("authorId") REFERENCES "User"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Announcement_hoaId_pinned_createdAt_idx" ON "Announcement"("hoaId", "pinned", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_hoaId_idx" ON "User"("hoaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Document_hoaId_category_idx" ON "Document"("hoaId", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_hoaId_timestamp_idx" ON "AuditLog"("hoaId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
