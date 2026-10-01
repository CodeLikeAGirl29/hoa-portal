// prisma/seed.ts
// Creates the demo data: communities, accounts, documents, announcements and
// a lived-in audit trail. Safe to run repeatedly — it only adds what's
// missing and never overwrites or deletes anything.
//
//   npm run db:seed
//
// With --if-enabled it does nothing unless SEED_DEMO_DATA=true, which is how
// the Vercel build runs it (see "vercel-build" in package.json).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// ─── Communities ────────────────────────────────────────────────────────────
// Communities listed in SYNC_DETAILS have their details written from this
// file on every run, so an edit here reaches a database that already has the
// community. That also overwrites changes made on the HOA Settings page —
// leave a community out of the list to let Settings win.
const SYNC_DETAILS = new Set(["fair-oaks"]);

const HOAS = [
  {
    name: "Fair Oaks HOA",
    slug: "fair-oaks",
    accentColor: "#185FA5",
    address: "601 Colonial Dr",
    city: "Ft Walton Beach",
    state: "FL",
    zip: "32547",
    phone: "(239) 555-0100",
    email: "fairoaksvillage32547@gmail.com",
  },
  {
    name: "Palm Grove Community HOA",
    slug: "palm-grove",
    accentColor: "#2D7A4F",
    address: "450 Palm Grove Dr",
    city: "Sarasota",
    state: "FL",
    zip: "34231",
    phone: "(941) 555-0200",
    email: "admin@palmgrovehoa.org",
  },
  {
    name: "Sunset Ridge HOA",
    slug: "sunset-ridge",
    accentColor: "#C45C1A",
    address: "200 Sunset Ridge Ct",
    city: "Orlando",
    state: "FL",
    zip: "32812",
    phone: "(407) 555-0300",
    email: "info@sunsetridgehoa.com",
  },
];

// ─── Demo accounts (these match the "View Demo" picker on /login) ───────────
const USERS: {
  email: string;
  name: string;
  password: string;
  role: string;
  hoaSlug: string | null;
}[] = [
  {
    email: "admin@fairoakshoa.org",
    name: "Board Administrator",
    password: "admin123",
    role: "admin",
    hoaSlug: "fair-oaks",
  },
  {
    email: "resident@fairoakshoa.org",
    name: "J. Martinez",
    password: "resident123",
    role: "resident",
    hoaSlug: "fair-oaks",
  },
  {
    email: "admin@palmgrovehoa.org",
    name: "Palm Grove Admin",
    password: "admin123",
    role: "admin",
    hoaSlug: "palm-grove",
  },
  {
    email: "resident@palmgrovehoa.org",
    name: "S. Thompson",
    password: "resident123",
    role: "resident",
    hoaSlug: "palm-grove",
  },
  {
    email: "admin@sunsetridgehoa.com",
    name: "Sunset Ridge Admin",
    password: "admin123",
    role: "admin",
    hoaSlug: "sunset-ridge",
  },
  {
    email: "superadmin@floridahoaportal.com",
    name: "Portal Super Admin",
    password: "super123",
    role: "superadmin",
    hoaSlug: null,
  },
];

// ─── Documents (added to every community) ───────────────────────────────────
const MOCK_DOCS = [
  {
    title: "Community Bylaws 2024",
    category: "governing",
    content:
      "These bylaws govern the HOA. All residents must comply with F.S. 720.303. Monthly dues are $350. The board consists of five elected members serving two-year staggered terms.",
    isPublic: true,
    isAccessibleToResidents: true,
    requiresLogin: false,
    isMandatoryRecord: true,
    fileSize: "248 KB",
    pages: 32,
  },
  {
    title: "Declaration of Covenants (CC&Rs)",
    category: "governing",
    content:
      "This Declaration establishes the rights and responsibilities of all property owners, established under Florida Statute 720. Restrictions include architectural standards, landscaping requirements, and pet policies.",
    isPublic: true,
    isAccessibleToResidents: true,
    requiresLogin: false,
    isMandatoryRecord: true,
    fileSize: "1.2 MB",
    pages: 87,
  },
  {
    title: "Q1 2025 Budget Summary",
    category: "financial",
    content:
      "Total operating budget: $1,240,000. Reserve fund balance: $423,500.00. Monthly dues collected: $98,750.00. Outstanding assessments: $12,340.00.",
    isPublic: false,
    isAccessibleToResidents: true,
    requiresLogin: true,
    isMandatoryRecord: true,
    fileSize: "156 KB",
    pages: 8,
  },
  {
    title: "Annual Meeting Minutes — March 2025",
    category: "meetings",
    content:
      "Quorum established at 7:04 PM with 23 of 40 owners present. Motion to approve 2025 budget passed 8–2. Pool renovation approved unanimously. Next meeting: June 15, 2025 at 6:30 PM.",
    isPublic: true,
    isAccessibleToResidents: true,
    requiresLogin: false,
    isMandatoryRecord: true,
    fileSize: "94 KB",
    pages: 5,
  },
  {
    title: "Pool Renovation Contract Bid",
    category: "contracts",
    content:
      "AquaBlue Contractors: $87,500 bid for full pool resurfacing and tile replacement. Payment: $43,750 upfront, $43,750 on completion. Estimated duration: 6 weeks.",
    isPublic: false,
    isAccessibleToResidents: true,
    requiresLogin: true,
    isMandatoryRecord: false,
    fileSize: "312 KB",
    pages: 14,
  },
  {
    title: "Detailed Expenditure Report FY2024",
    category: "financial",
    content:
      "Itemized expenses: Attorney fees $24,500. Management company $36,000. Landscaping $48,200. Insurance premium $32,150. Emergency repairs $11,400.",
    isPublic: false,
    isAccessibleToResidents: false,
    requiresLogin: true,
    isMandatoryRecord: false,
    fileSize: "892 KB",
    pages: 64,
  },
  {
    title: "Legal Correspondence — June 2025",
    category: "legal",
    content:
      "Re: Lot 47 variance dispute. Settlement offer under review. Attorney opinion: case likely to resolve favorably. Recommended treatment: expedited mediation to avoid trial.",
    isPublic: false,
    isAccessibleToResidents: false,
    requiresLogin: true,
    isMandatoryRecord: false,
    fileSize: "67 KB",
    pages: 3,
  },
  {
    title: "Architectural Review — Lot 23 Fence",
    category: "architectural",
    content:
      "Application submitted by Lot 23 owner. Proposed: 6-foot privacy fence, white vinyl, rear property line. Board decision: APPROVED with condition of HOA-standard post caps. Effective: May 1, 2025.",
    isPublic: false,
    isAccessibleToResidents: true,
    requiresLogin: true,
    isMandatoryRecord: true,
    fileSize: "34 KB",
    pages: 2,
  },
  {
    title: "Current Insurance Policy Summary",
    category: "insurance",
    content:
      "Carrier: Coastal Mutual Insurance. Policy #: CMI-2025-HOA-0047. Coverage: $8.5M property damage, $2M general liability, $500K D&O. Annual premium: $32,150. Renewal date: January 15, 2026.",
    isPublic: false,
    isAccessibleToResidents: true,
    requiresLogin: true,
    isMandatoryRecord: true,
    fileSize: "128 KB",
    pages: 11,
  },
  {
    title: "Violation Notice — Lot 8 (Redacted)",
    category: "violations",
    content:
      "Violation #: VIO-2025-008. Infraction: Unapproved fence installation. Notice date: May 12, 2025. Homeowner identity redacted per privacy policy. Remedy required by June 12, 2025. Fine: $100/day thereafter.",
    isPublic: false,
    isAccessibleToResidents: true,
    requiresLogin: true,
    isMandatoryRecord: true,
    fileSize: "22 KB",
    pages: 1,
  },
];

// ─── Announcements (added to every community that has none) ─────────────────
const ANNOUNCEMENTS = [
  {
    title: "Annual Meeting — Save the Date",
    body: "The annual members' meeting will be held in the clubhouse. The agenda and proxy forms are posted in the document vault under Meetings.",
    pinned: true,
  },
  {
    title: "Pool Resurfacing Schedule",
    body: "The community pool will be closed for resurfacing for approximately six weeks. Thank you for your patience while the work is completed.",
    pinned: false,
  },
];

// ─── Audit trail ────────────────────────────────────────────────────────────
const AUDIT_ENTRIES_PER_HOA = 40; // rows generated per community
const AUDIT_DAYS_BACK = 10; // spread timestamps across this many days

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

// A timestamp in the last AUDIT_DAYS_BACK days, biased toward 8am–8pm so the
// trail reads like real human activity. Never in the future.
function randomTimestamp(): Date {
  const now = Date.now();
  const offsetMs = Math.random() * AUDIT_DAYS_BACK * 24 * 60 * 60 * 1000;
  const d = new Date(now - offsetMs);
  d.setHours(
    8 + Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0
  );
  return d.getTime() > now ? new Date(now - 60_000) : d;
}

async function main() {
  if (
    process.argv.includes("--if-enabled") &&
    process.env.SEED_DEMO_DATA !== "true"
  ) {
    console.log("Skipping demo seed (set SEED_DEMO_DATA=true to enable).");
    return;
  }

  console.log("🌱 Seeding Florida HOA Portal...");

  // Communities
  const hoaBySlug = new Map<string, { id: string; name: string }>();
  for (const hoa of HOAS) {
    const { slug, ...details } = hoa;
    const row = await prisma.hOA.upsert({
      where: { slug },
      update: SYNC_DETAILS.has(slug) ? details : {},
      create: hoa,
    });
    hoaBySlug.set(hoa.slug, row);
  }
  console.log(`   ✓ ${HOAS.length} communities`);

  // Accounts. Existing accounts are left exactly as they are, so a password
  // someone changed is never reset by re-running the seed.
  let createdUsers = 0;
  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: await bcrypt.hash(u.password, 10),
        role: u.role,
        hoaId: u.hoaSlug ? hoaBySlug.get(u.hoaSlug)!.id : null,
      },
    });
    createdUsers++;
  }
  console.log(`   ✓ ${createdUsers} new account(s), ${USERS.length - createdUsers} already present`);

  for (const [slug, hoa] of hoaBySlug) {
    // Documents — matched by title, so re-running never duplicates.
    const existingTitles = new Set(
      (
        await prisma.document.findMany({
          where: { hoaId: hoa.id },
          select: { title: true },
        })
      ).map((d) => d.title)
    );
    const newDocs = MOCK_DOCS.filter((d) => !existingTitles.has(d.title));
    if (newDocs.length > 0) {
      await prisma.document.createMany({
        data: newDocs.map((d) => ({
          ...d,
          hoaId: hoa.id,
          uploadedBy: "system-seed",
        })),
      });
    }

    const users = await prisma.user.findMany({
      where: { hoaId: hoa.id, active: true },
      select: { id: true, role: true },
    });
    const admin = users.find((u) => u.role === "admin");

    // Announcements — only for a community that has none.
    let newAnnouncements = 0;
    if (admin) {
      const count = await prisma.announcement.count({ where: { hoaId: hoa.id } });
      if (count === 0) {
        await prisma.announcement.createMany({
          data: ANNOUNCEMENTS.map((a) => ({
            ...a,
            hoaId: hoa.id,
            authorId: admin.id,
          })),
        });
        newAnnouncements = ANNOUNCEMENTS.length;
      }
    }

    // Audit trail — only for a community that has none.
    let newAudit = 0;
    const auditCount = await prisma.auditLog.count({ where: { hoaId: hoa.id } });
    if (auditCount === 0 && users.length > 0) {
      const docs = await prisma.document.findMany({
        where: { hoaId: hoa.id },
        select: { id: true, title: true },
      });
      const rows = [];
      for (let i = 0; i < AUDIT_ENTRIES_PER_HOA; i++) {
        const a = weightedAction();
        const doc = a.needsDoc && docs.length > 0 ? pick(docs) : null;
        rows.push({
          hoaId: hoa.id,
          userId: pick(users).id,
          // If the action needs a document but none exist, fall back to LOGIN.
          action: a.needsDoc && !doc ? "LOGIN" : a.action,
          documentId: doc?.id ?? null,
          documentTitle: doc?.title ?? null,
          ipAddress: pick(SAMPLE_IPS),
          userAgent: pick(SAMPLE_AGENTS),
          timestamp: randomTimestamp(),
        });
      }
      await prisma.auditLog.createMany({ data: rows });
      newAudit = rows.length;
    }

    console.log(
      `   ✓ ${slug}: +${newDocs.length} documents, +${newAnnouncements} announcements, +${newAudit} audit entries`
    );
  }

  console.log("✅ Seed complete.");
  console.log("\n🔑 Demo credentials:");
  console.log("  Fair Oaks admin:    admin@fairoakshoa.org / admin123");
  console.log("  Fair Oaks resident: resident@fairoakshoa.org / resident123");
  console.log("  Palm Grove admin:   admin@palmgrovehoa.org / admin123");
  console.log("  Palm Grove resident: resident@palmgrovehoa.org / resident123");
  console.log("  Sunset Ridge admin: admin@sunsetridgehoa.com / admin123");
  console.log("  Superadmin:         superadmin@floridahoaportal.com / super123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
