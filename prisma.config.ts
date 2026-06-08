// prisma.config.ts — used by Prisma CLI (migrate, generate, studio) only.
// Runtime client config lives in src/lib/prisma.ts.
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    adapter: new PrismaPg(
      new Pool({ connectionString: process.env.DATABASE_URL })
    ),
  },
});
