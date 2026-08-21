# 🏡 Villa Platform — Mavon

A domain-driven modular monorepo for a villa booking SaaS, built with **Turborepo** and **pnpm workspaces**.

---

## Architecture

```text
villa-platform/
│
├── apps/           # Independently deployable applications
├── packages/       # Shared libraries (UI, auth, RBAC, payments, database…)
├── services/       # Background workers and async jobs
├── domains/        # Business logic organized by feature
├── infrastructure/ # Cloud config (Cloudflare, Terraform, Docker, monitoring)
├── docs/           # Internal documentation
├── scripts/        # CLI utilities (seed, migrate, backup…)
├── tests/          # Cross-cutting test suites
├── .github/        # CI/CD workflows
└── docker/         # Docker compose and Dockerfiles
```

---

## Applications

| App | Subdomain | Purpose |
|-----|-----------|---------|
| **landing** | `mavon.online` | Marketing, SEO, landing pages, blog |
| **booking** | `booking.mavon.online` | Guest-facing villa search, booking, checkout |
| **admin** | `admin.mavon.online` | Platform admin dashboard |
| **owner** | `owner.mavon.online` | Villa owner portal (calendar, pricing, revenue) |
| **staff** | `staff.mavon.online` | On-site staff operations (check-in, cash, UPI) |
| **auth** | `auth.mavon.online` | Authentication flows (login, register, verify) |
| **api** | `api.mavon.online` | REST/GraphQL API server |
| **docs** | `docs.mavon.online` | Developer documentation |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL
- Redis (optional, for queues)

### Setup

```bash
# Clone the repo
git clone <repo-url> villa-platform
cd villa-platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
pnpm --filter @villa-platform/database db:generate

# Run database migrations
pnpm --filter @villa-platform/database db:migrate

# Seed the database
pnpm --filter @villa-platform/database db:seed

# Start all apps in development
pnpm dev
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all workspaces |
| `pnpm test` | Run all tests |
| `pnpm type-check` | TypeScript type checking |
| `pnpm clean` | Clean all build artifacts |

---

## Shared Packages

All packages live under `packages/` and are importable by any app:

- **`@villa-platform/ui`** — Design system components
- **`@villa-platform/database`** — Prisma schema, migrations, repositories
- **`@villa-platform/auth`** — Clerk integration, sessions, JWT
- **`@villa-platform/rbac`** — Casbin policies, roles, permissions
- **`@villa-platform/payment`** — Razorpay integration, refunds, invoices
- **`@villa-platform/storage`** — Cloudflare R2, signed URLs, uploads
- **`@villa-platform/emails`** — Transactional email templates
- **`@villa-platform/validation`** — Shared Zod schemas
- **`@villa-platform/types`** — Shared TypeScript types
- **`@villa-platform/config`** — Shared configuration
- **`@villa-platform/logger`** — Structured logging
- **`@villa-platform/utils`** — Common utilities

---

## Domain Modules

Business logic is organized by feature under `domains/`:

```
authentication · users · villas · bookings · calendar · pricing
availability · payments · invoices · reviews · notifications
analytics · reports · support · cms · media · search · coupons
loyalty · audit · rbac · settings
```

Each domain follows a consistent internal structure:
`controllers/ · services/ · repositories/ · validators/ · dto/ · events/ · policies/ · tests/`

---

## License

Private — All rights reserved.
