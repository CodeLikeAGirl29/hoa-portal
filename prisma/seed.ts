// prisma/seed.ts
// Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Florida HOA Portal...");

  // ─── HOAs ────────────────────────────────────────────────────────────────
  const pelicanBay = await prisma.hOA.upsert({
    where: { slug: "pelican-bay" },
    update: {},
    create: {
      name: "Pelican Bay HOA",
      slug: "pelican-bay",
      accentColor: "#185FA5",
      address: "1 Pelican Bay Blvd",
      city: "Naples",
      state: "FL",
      zip: "34108",
      phone: "(239) 555-0100",
      email: "board@pelicanbayhoa.org",
    },
  });

  const palmGrove = await prisma.hOA.upsert({
    where: { slug: "palm-grove" },
    update: {},
    create: {
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
  });

  const sunsetRidge = await prisma.hOA.upsert({
    where: { slug: "sunset-ridge" },
    update: {},
    create: {
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
  });

  // ─── Users ────────────────────────────────────────────────────────────────
  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  // Pelican Bay users
  await prisma.user.upsert({
    where: { email: "admin@pelicanbayhoa.org" },
    update: {},
    create: {
      email: "admin@pelicanbayhoa.org",
      name: "Board Administrator",
      password: await hash("admin123"),
      role: "admin",
      hoaId: pelicanBay.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "resident@pelicanbayhoa.org" },
    update: {},
    create: {
      email: "resident@pelicanbayhoa.org",
      name: "J. Martinez",
      password: await hash("resident123"),
      role: "resident",
      hoaId: pelicanBay.id,
    },
  });

  // Palm Grove users
  await prisma.user.upsert({
    where: { email: "admin@palmgrovehoa.org" },
    update: {},
    create: {
      email: "admin@palmgrovehoa.org",
      name: "Palm Grove Admin",
      password: await hash("admin123"),
      role: "admin",
      hoaId: palmGrove.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "resident@palmgrovehoa.org" },
    update: {},
    create: {
      email: "resident@palmgrovehoa.org",
      name: "S. Thompson",
      password: await hash("resident123"),
      role: "resident",
      hoaId: palmGrove.id,
    },
  });

  // Sunset Ridge users
  await prisma.user.upsert({
    where: { email: "admin@sunsetridgehoa.com" },
    update: {},
    create: {
      email: "admin@sunsetridgehoa.com",
      name: "Sunset Ridge Admin",
      password: await hash("admin123"),
      role: "admin",
      hoaId: sunsetRidge.id,
    },
  });

  // Superadmin (can see all HOAs)
  await prisma.user.upsert({
    where: { email: "superadmin@floridahoaportal.com" },
    update: {},
    create: {
      email: "superadmin@floridahoaportal.com",
      name: "Portal Super Admin",
      password: await hash("super123"),
      role: "superadmin",
      hoaId: null,
    },
  });

  // ─── Sample documents for Pelican Bay ─────────────────────────────────────
  await prisma.document.upsert({
    where: { id: "doc-pb-001" },
    update: {},
    create: {
      id: "doc-pb-001",
      hoaId: pelicanBay.id,
      title: "Community Bylaws 2024",
      category: "governing",
      content:
        "These bylaws govern the Pelican Bay HOA. All residents must comply with F.S. 720.303. Monthly dues are $350.",
      isPublic: true,
      isAccessibleToResidents: true,
      requiresLogin: false,
      isMandatoryRecord: true,
      fileSize: "248 KB",
      pages: 32,
    },
  });

  await prisma.document.upsert({
    where: { id: "doc-pb-002" },
    update: {},
    create: {
      id: "doc-pb-002",
      hoaId: pelicanBay.id,
      title: "Q1 2025 Budget Summary",
      category: "financial",
      content:
        "Total operating budget: $1,240,000. Reserve fund balance: $423,500. Monthly dues collected: $98,750.",
      isPublic: false,
      isAccessibleToResidents: true,
      requiresLogin: true,
      isMandatoryRecord: true,
      fileSize: "156 KB",
      pages: 8,
    },
  });

  // ─── Sample documents for Palm Grove ─────────────────────────────────────
  await prisma.document.upsert({
    where: { id: "doc-pg-001" },
    update: {},
    create: {
      id: "doc-pg-001",
      hoaId: palmGrove.id,
      title: "Palm Grove CC&Rs",
      category: "governing",
      content:
        "This declaration establishes the rights and responsibilities of all property owners within Palm Grove Community HOA.",
      isPublic: true,
      isAccessibleToResidents: true,
      requiresLogin: false,
      isMandatoryRecord: true,
      fileSize: "890 KB",
      pages: 54,
    },
  });

  console.log("✅ Seed complete.");
  console.log("\n🔑 Demo credentials:");
  console.log("  Pelican Bay admin:    admin@pelicanbayhoa.org / admin123");
  console.log(
    "  Pelican Bay resident: resident@pelicanbayhoa.org / resident123"
  );
  console.log("  Palm Grove admin:     admin@palmgrovehoa.org / admin123");
  console.log(
    "  Superadmin:           superadmin@floridahoaportal.com / super123"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
