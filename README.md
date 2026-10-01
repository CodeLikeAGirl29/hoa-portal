# Florida HOA Portal

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

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

> view project [here](https://myflhoa.org)

## The Strategic "Why"

> Managing a Homeowners Association (HOA) often involves a fragmented landscape of manual processes, disparate communication channels, and opaque financial tracking. This leads to inefficiencies, resident frustration, and a significant administrative burden on board members and property managers. The lack of a centralized, accessible platform can hinder effective governance and community cohesion.

The `hoa-portal` project delivers a robust, full-stack web application designed to centralize and automate key HOA operations. By providing a secure, intuitive platform for communication, document management, financial oversight, and resident services, `hoa-portal` empowers HOAs to operate with unparalleled efficiency, transparency, and resident satisfaction. It transforms fragmented processes into a seamless, integrated digital experience, fostering a more connected and well-managed community.

---

## Key Features

✨ **Centralized Communication Hub**: Facilitates seamless announcements, discussions, and direct messaging, fostering a more connected community.
🔑 **Secure Resident & Admin Authentication**: Implements robust access control, ensuring data privacy and appropriate permissions for all users.
📄 **Comprehensive Document Management**: Provides a secure repository for bylaws, meeting minutes, financial reports, and other vital documents, easily accessible to authorized members.
💰 **Intuitive Financial Tracking & Reporting**: Offers clear dashboards and detailed reports for dues, expenses, and budgeting, enhancing financial transparency and oversight.
🛠️ **Streamlined Maintenance Request System**: Allows residents to submit and track service requests effortlessly, improving response times and accountability.
📊 **Customizable Dashboards**: Delivers personalized overviews for residents and administrators, presenting key information and actionable insights at a glance.

---

## Technical Architecture

The `hoa-portal` is built upon a modern, performant, and scalable full-stack architecture, leveraging industry-leading technologies to ensure a robust and maintainable application.

### Tech Stack

| Technology       | Purpose                     | Key Benefit                                                                                  |
| :--------------- | :-------------------------- | :------------------------------------------------------------------------------------------- |
| **Next.js**      | Full-stack React Framework  | Server-side rendering (SSR), API routes, optimized performance, SEO-friendly.                |
| **PostgreSQL**   | Relational Database         | Robust, scalable, ACID-compliant data storage, high integrity.                               |
| **Prisma**       | Next-generation ORM         | Type-safe database access, simplified migrations, auto-generated client.                     |
| **Tailwind CSS** | Utility-First CSS Framework | Rapid UI development, consistent design system, highly customizable.                         |
| **TypeScript**   | Superset of JavaScript      | Enhanced code quality, improved maintainability, fewer runtime errors through static typing. |

### Directory Structure

```
hoa-portal/
├── 📁 prisma/
│   └── 📄 schema.prisma
├── 📁 public/
│   └── 📄 favicon.ico
├── 📁 src/
│   ├── 📁 app/
│   ├── 📁 components/
│   ├── 📁 lib/
│   └── 📁 styles/
├── 📄 .gitignore
├── 📄 next-env.d.ts
├── 📄 next.config.ts
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 postcss.config.mjs
├── 📄 prisma.config.ts
├── 📄 README.md
├── 📄 tailwind.config.ts
└── 📄 tsconfig.json
```

---

## Operational Setup

This section provides a comprehensive guide to getting `hoa-portal` up and running on your local development environment.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18.x or higher (LTS recommended).
- **npm** (Node Package Manager): Comes bundled with Node.js. Alternatively, you can use `yarn` or `pnpm`.
- **PostgreSQL**: A running instance of a PostgreSQL database. You can use Docker for a quick setup.

### Installation

1.  **Clone the repository and install dependencies**

    ```bash
    git clone https://github.com/CodeLikeAGirl29/hoa-portal.git
    cd hoa-portal
    npm install
    ```

2.  **Configure the environment** — copy `.env.example` to `.env` and fill in
    `DATABASE_URL`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and
    `NEXTAUTH_URL`.

3.  **Set up the database** — creates every table, then adds the demo
    communities, accounts, documents and announcements:

    ```bash
    npm run db:setup
    ```

4.  **Start the development server**

    ```bash
    npm run dev
    ```

    The application is now at `http://localhost:3000`. Use **View Demo** on
    the login page to sign in as any demo account.

### Database commands

| Command              | What it does                                                        |
| :------------------- | :------------------------------------------------------------------ |
| `npm run db:setup`   | Apply all migrations, then seed. Use this on a new database.        |
| `npm run db:deploy`  | Apply pending migrations only (safe for production).                |
| `npm run db:seed`    | Add any missing demo data. Never overwrites or deletes anything.    |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma`.        |
| `npm run db:status`  | Show which migrations the database has and hasn't applied.          |

**After every change to `prisma/schema.prisma`, run `npm run db:migrate` and
commit the new folder under `prisma/migrations/`.** A model that exists in the
schema but in no migration produces `relation "public.<Model>" does not exist`
on any database built from the migrations.

### Deploying to Vercel

The `vercel-build` script runs `prisma migrate deploy` before `next build`, so
every deploy brings the production database up to date automatically. Set
`SEED_DEMO_DATA=true` in the project's environment variables if deploys should
also add missing demo data.

### File uploads

Admins can attach a PDF, Word, Excel, PNG or JPEG file (up to 4 MB) to any
document. Files are stored in the database (`DocumentFile` table), so there is
no separate storage service to set up.

- The 4 MB limit exists because Vercel rejects larger request bodies. To
  accept bigger files, move storage to an object store such as Vercel Blob.
- **Files are shared exactly as uploaded.** Automatic redaction only applies
  to a document's typed text, never to the contents of an attached file.

### Email, password resets and invitations

Set `RESEND_API_KEY` (and `FROM_EMAIL`, an address on a domain verified in
Resend) to turn on email. With it:

- **Forgot password** on the sign-in page emails a one-time link (valid 1 hour).
- **Invite member** on the Members page emails a link to choose a password
  (valid 7 days). **Send link** re-sends one to an existing member.

Without `RESEND_API_KEY`, invitations still work: the Members page shows the
link so the admin can send it themselves. Forgot-password tells the person to
ask their administrator. `NEXTAUTH_URL` must be the site's real address, since
it is used to build these links.

### Troubleshooting database errors

Open **`/api/health`** on the running site. It reports one of:

| Response                                   | Meaning                         | Fix                                   |
| :----------------------------------------- | :------------------------------ | :------------------------------------ |
| `"database": "down"`                       | Can't connect                   | Check `DATABASE_URL`; is the DB up?   |
| `"schema": "out-of-date"` + `missingTables` | Migrations haven't been applied | `npm run db:deploy`                   |
| `"seeded": false`                          | Tables exist but are empty      | `npm run db:seed`                     |
| `"ok": true, "seeded": true`               | Database is healthy             | —                                     |

If `prisma migrate deploy` fails with **P3005** ("the database schema is not
empty"), the database was created without migration history (for example with
`prisma db push`). Tell Prisma the first two migrations are already in place,
then deploy the rest:

```bash
npx prisma migrate resolve --applied 20260608123903_init
npx prisma migrate resolve --applied 20260608182416_add_hoa_branding
npm run db:deploy
```

---

## Community & Governance

We welcome and encourage contributions from the community to enhance `hoa-portal`.

### Contributing

We believe in collaborative development and appreciate any effort to improve this project. If you'd like to contribute, please follow these guidelines:

1.  **Fork the repository**: Start by forking the `hoa-portal` repository to your GitHub account.
2.  **Create a new branch**: For each feature or bug fix, create a new branch from `main` (e.g., `feature/add-user-profile` or `bugfix/fix-login-issue`).
3.  **Implement your changes**: Write clean, maintainable code, adhering to the project's coding standards. Ensure your changes are well-tested.
4.  **Commit your changes**: Write clear, concise commit messages that explain the purpose of your changes.
5.  **Push to your fork**: Push your new branch to your forked repository.
6.  **Open a Pull Request (PR)**: Submit a pull request from your branch to the `main` branch of the original `hoa-portal` repository. Provide a detailed description of your changes and why they are valuable.

We will review your PR as soon as possible. Thank you for helping make `hoa-portal` better!
