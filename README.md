# Florida HOA Portal

![Last commit](https://img.shields.io/github/last-commit/CodeLikeAGirl29/hoa-portal?style=for-the-badge&logo=github) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 📑 Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Key Dependencies](#key-dependencies)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Contributing](#contributing)

## 📝 Description

A full-stack web app built with Next.js, PostgreSQL, Prisma, Tailwind CSS, TypeScript.

> view project [here](https://hoa-portal-tau.vercel.app/)

## 🛠️ Tech Stack

- ▲ **Next.js**
- 🐘 **PostgreSQL**
- 🔷 **Prisma**
- 🌬️ **Tailwind CSS**
- 📘 **TypeScript**

**Notable libraries:** NextAuth

## ⚡ Quick Start

```bash

# 1. Clone the repository
git clone https://github.com/CodeLikeAGirl29/hoa-portal.git

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

## 📦 Key Dependencies

```
@prisma/adapter-pg: ^7.8.0
@prisma/client: ^7.8.0
bcrypt: ^6.0.0
crypto: ^1.0.1
dotenv: ^17.4.2
next: ^16.2.7
next-auth: ^4.24.14
pg: ^8.21.0
react: ^19.0.0
react-dom: ^19.0.0
```

## 🚀 Available Scripts

- **dev** — `npm run dev`
- **build** — `npm run build`
- **start** — `npm run start`
- **lint** — `npm run lint`
- **type-check** — `npm run type-check`
- **seed** — `npm run seed`
- **postinstall** — `npm run postinstall`

## 🌐 API Endpoints

Detected endpoints (best-effort scan):

```
/api/audit
/api/auth/[...nextauth]
/api/docs/[id]
/api/documents
```

## 📁 Project Structure

```
.
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma
│   ├── migrations
│   │   ├── 20260608123903_init
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── prisma.config.ts
│   ├── schema.prisma
│   └── seed.ts
├── prisma.config.ts
├── src
│   ├── app
│   │   ├── actions
│   │   │   └── audit.ts
│   │   ├── api
│   │   │   ├── audit
│   │   │   │   └── route.ts
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       └── ...
│   │   │   ├── docs
│   │   │   │   └── [id]
│   │   │   │       └── ...
│   │   │   └── documents
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── admin
│   │   │   ├── AccessMatrixTable.tsx
│   │   │   ├── AuditTrailPanel.tsx
│   │   │   └── ImplementationChecklist.tsx
│   │   ├── layout
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ComplianceFooter.tsx
│   │   │   ├── Header.tsx
│   │   │   └── StatsBar.tsx
│   │   ├── ui
│   │   │   ├── DownloadToast.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── index.tsx
│   │   └── vault
│   │       ├── DocumentCard.tsx
│   │       ├── DocumentVault.tsx
│   │       └── DocumentViewer.tsx
│   ├── hooks
│   │   ├── useAuditLog.ts
│   │   └── useAuth.tsx
│   ├── lib
│   │   ├── auth.ts
│   │   ├── data.ts
│   │   ├── prisma.ts
│   │   └── redaction.ts
│   └── types
│       ├── index.ts
│       └── next-auth.d.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🛠️ Development Setup

### Node.js / JavaScript

1. Install Node.js (v18+ recommended)
2. Install dependencies: `npm install` (or `yarn` / `pnpm install` / `bun install`)
3. Start the dev server: see the **Quick Start** above

## 👥 Contributing

Contributions are welcome! Here's the standard flow:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/CodeLikeAGirl29/hoa-portal.git`
3. **Branch**: `git checkout -b feature/your-feature`
4. **Commit**: `git commit -m 'feat: add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open** a pull request

Please follow the existing code style and include tests for new behavior where applicable.
