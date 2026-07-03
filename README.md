# Safebox Quotation System

A production-grade quotation management system: create jobs, generate multiple pricing options per job, apply markup, track edit history, and export pixel-accurate PDF quotations matching the Safebox Energy document format.

## Tech Stack

- **Frontend:** React 18 (Vite), React Router DOM, Recharts, Tabler Icons
- **Backend:** Node.js 18+, Express, SQLite (better-sqlite3), JWT auth, bcryptjs, uuid, Puppeteer (PDF)
- **Infra:** Docker, Docker Compose, Nginx reverse proxy, GitHub Actions CI/CD, AWS EC2

## Project Structure

```
safebox-system/
├── backend/            Express API + SQLite + PDF generation
├── frontend/           React (Vite) admin UI
├── nginx/              Reverse proxy (routes /api -> backend, / -> frontend)
├── docker-compose.yml  Production stack
├── docker-compose.dev.yml
├── scripts/            setup.sh, dev.sh, build.sh, deploy.sh, backup.sh, logs.sh
└── .github/workflows/  CI/CD pipeline
```

## Running Locally (without Docker)

```bash
./scripts/setup.sh          # installs backend + frontend deps, creates .env files

# terminal 1
cd backend && npm run dev   # http://localhost:4000

# terminal 2
cd frontend && npm run dev  # http://localhost:5173 (proxies /api to :4000)
```

Default seeded admin login: `admin@safebox.local` / `Admin@123` (change immediately in production).

## Running with Docker (development, hot reload)

```bash
./scripts/dev.sh
```

## Running with Docker (production)

```bash
./scripts/build.sh
docker-compose up -d
```

The stack is served on `http://localhost` (nginx reverse proxy → `/api` to backend, everything else to the frontend static build). Database persists in the `safebox-db` named volume.

## Deploying to AWS EC2

1. Provision an EC2 instance with Docker + Docker Compose installed, clone this repo there.
2. Configure GitHub repository secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (private key), `EC2_PROJECT_PATH`.
3. Push to `main` — `.github/workflows/deploy.yml` builds the images and uses `appleboy/ssh-action` to pull + restart the stack on the server.
4. For manual deploys from your machine: set `EC2_HOST` (and optionally `EC2_USER`, `EC2_PATH`) and run `./scripts/deploy.sh`.

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`. Notably, `backend/.env` controls the company profile embedded in generated PDFs (`COMPANY_NAME`, `COMPANY_ADDRESS_LINES`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_REG_NUMBER`, `COMPANY_BRAND_COLOR`) and `JWT_SECRET` (must be changed for production).

## Core Concepts

- **Jobs** are the parent project/client record. Each job can have 5-6 **quotation options** (`OPTION 1`, `OPTION 2`, ...).
- Each quotation option has line items (catalog-selected or custom), an internal `unit_cost` used to compute `subtotal`, and a `markup_percent` applied to reach `grand_total` (the final client-facing price): `grand_total = subtotal + subtotal * markup_percent / 100`.
- Every create/edit/markup change is snapshotted into `quotation_versions` for full history and re-opening past quotes.
- `GET /api/quotes/:id/pdf` renders a single option as an A4 PDF matching the Safebox quotation layout (green OPTION bar, S/N | Item | Quantity table, full-width TOTAL bar, "This option will power" bullet list).
- `GET /api/jobs/:id/proposal/pdf` renders a combined proposal PDF: cover page + company profile page + every quotation option for that job.

## Roles

| Role    | Permissions                     |
|---------|----------------------------------|
| Admin   | Full access, incl. user & item management, deletes |
| Manager | Create/edit jobs, quotes, items  |
| Staff   | Create jobs and quotes only      |

New users are created by an admin via the Users page (`POST /api/auth/register`, requires an authenticated admin).
