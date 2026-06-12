// prisma/seed-audit.ts
// Run after seeding users + documents:
//   npx tsx prisma/seed-audit.ts
//
// Generates realistic, time-staggered audit activity for every active HOA so
// the dashboard "Recent Activity" feed and the Audit Trail page look lived-in
// from the very first second of a demo.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Tunables ───────────────────────────────────────────────────────────────
const ENTRIES_PER_HOA = 40; // how many audit rows to generate per community
const DAYS_BACK = 10; // spread timestamps across this many days

// Weighted action mix — VIEW dominates, the rest sprinkle in for realism.
const ACTION_WEIGHTS: { action: string; weight: number; needsDoc: boolean }[] =
  [
    { action: "VIEW", weight: 50, needsDoc: true },
    { action: "DOWNLOAD", weight: 18, needsDoc: true },
    { action: "LOGIN", weight: 14, needsDoc: false },
    { action: "SEARCH", weight: 8, needsDoc: false },
    { action: "CREATE", weight: 5, needsDoc: true },
    { action: "UPDATE", weight: 3, needsDoc: true },
    { action: "UNAUTHORIZED_ACCESS_ATTEMPT", weight: 2, needsDoc: true },
  ];

const SAMPLE_IPS = [
  "73.118.42.17",
  "98.207.11.204",
  "24.165.88.13",
  "172.58.140.92",
  "104.28.7.55",
  "68.203.19.240",
];

const SAMPLE_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedAction() {
  const total = ACTION_WEIGHTS.reduce((s, a) => s + a.weight, 0);
  let roll = Math.random() * total;
  for (const a of ACTION_WEIGHTS) {
    roll -= a.weight;
    if (roll <= 0) return a;
  }
  return ACTION_WEIGHTS[0];
}

// A timestamp somewhere in the last DAYS_BACK days, biased toward business
// hours (8am–8pm) so the trail reads like real human activity.
function randomTimestamp(): Date {
  const now = Date.now();
  const offsetMs = Math.random() * DAYS_BACK * 24 * 60 * 60 * 1000;
  const d = new Date(now - offsetMs);
  const hour = 8 + Math.floor(Math.random() * 12); // 8–19
  d.setHours(
    hour,
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0
  );
  return d;
}

async function main() {
  console.log("🗃️  Seeding audit trail activity…\n");

  const hoas = await prisma.hOA.findMany({ where: { active: true } });

  if (hoas.length === 0) {
    console.log("⚠️  No active HOAs found. Run `npx prisma db seed` first.");
    return;
  }

  let grandTotal = 0;

  for (const hoa of hoas) {
    console.log(`🏘️  ${hoa.name}`);

    const [users, docs] = await Promise.all([
      prisma.user.findMany({
        where: { hoaId: hoa.id, active: true },
        select: { id: true, email: true, role: true },
      }),
      prisma.document.findMany({
        where: { hoaId: hoa.id },
        select: { id: true, title: true },
      }),
    ]);

    if (users.length === 0) {
      console.log("   ↳ No users for this HOA — skipping.\n");
      continue;
    }

    // Avoid double-seeding: if a trail already exists, leave it alone.
    const existing = await prisma.auditLog.count({ where: { hoaId: hoa.id } });
    if (existing > 0) {
      console.log(`   ↳ Already has ${existing} audit entries — skipping.\n`);
      continue;
    }

    const rows = [];
    for (let i = 0; i < ENTRIES_PER_HOA; i++) {
      const a = weightedAction();
      const actor = pick(users);
      const doc = a.needsDoc && docs.length > 0 ? pick(docs) : null;

      // If the action needs a document but none exist, fall back to LOGIN.
      const action = a.needsDoc && !doc ? "LOGIN" : a.action;

      rows.push({
        hoaId: hoa.id,
        userId: actor.id,
        action,
        documentId: doc?.id ?? null,
        documentTitle: doc?.title ?? null,
        ipAddress: pick(SAMPLE_IPS),
        userAgent: pick(SAMPLE_AGENTS),
        timestamp: randomTimestamp(),
      });
    }

    await prisma.auditLog.createMany({ data: rows });
    grandTotal += rows.length;
    console.log(
      `   ✓ ${rows.length} entries across ${users.length} member(s) and ${docs.length} document(s)\n`
    );
  }

  console.log(`✅ Done — ${grandTotal} audit entries created.`);
  console.log(
    "   The dashboard Recent Activity feed and /admin/audit are now populated."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
