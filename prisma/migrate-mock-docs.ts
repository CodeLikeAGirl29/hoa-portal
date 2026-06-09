// prisma/migrate-mock-docs.ts
// Run once: npx tsx prisma/migrate-mock-docs.ts
// Inserts the mock documents from src/lib/data.ts into the real DB
// for each seeded HOA so the vault shows content immediately.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Inline the mock docs here so this script is self-contained
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

async function main() {
  console.log("📄 Migrating mock documents to database…\n");

  const hoas = await prisma.hOA.findMany({ where: { active: true } });

  if (hoas.length === 0) {
    console.log("⚠️  No HOAs found. Run `npx prisma db seed` first.");
    return;
  }

  for (const hoa of hoas) {
    console.log(`\n🏘️  ${hoa.name} (${hoa.id})`);

    // Check how many docs already exist
    const existing = await prisma.document.count({ where: { hoaId: hoa.id } });
    if (existing > 0) {
      console.log(`   ↳ Already has ${existing} documents — skipping.`);
      continue;
    }

    for (const doc of MOCK_DOCS) {
      await prisma.document.create({
        data: {
          hoaId: hoa.id,
          title: doc.title,
          category: doc.category,
          content: doc.content,
          isPublic: doc.isPublic,
          isAccessibleToResidents: doc.isAccessibleToResidents,
          requiresLogin: doc.requiresLogin,
          isMandatoryRecord: doc.isMandatoryRecord,
          fileSize: doc.fileSize,
          pages: doc.pages,
          uploadedBy: "system-migration",
        },
      });
      console.log(`   ✓ ${doc.title}`);
    }
  }

  console.log("\n✅ Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
