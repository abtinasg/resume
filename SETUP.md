# ResumeIQ Setup Guide

## Prerequisites

- Node.js 18+ (check: `node --version`)
- npm or yarn
- PostgreSQL 14+ (or SQLite for local development)
- OpenAI API key

## Setup Steps

### 1. Clone Repository
```bash
git clone <repo-url>
cd resumeiq
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Database

**Option A: SQLite (default for development)**

SQLite is preconfigured in the Prisma schema. No additional setup needed.

**Option B: Local PostgreSQL**
```bash
createdb resumeiq
```

Update `prisma/schema.prisma` to use PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Option C: Docker**
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=resumeiq postgres:14
```

### 4. Configure Environment Variables

Copy example file:
```bash
cp .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL=file:./dev.db                  # SQLite (default)
# DATABASE_URL=postgresql://user:password@localhost:5432/resumeiq  # PostgreSQL

OPENAI_API_KEY=sk-...                       # Required for AI features
OPENAI_MODEL=gpt-4o                         # Or gpt-4o-mini for cost efficiency

NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
JWT_SECRET=<generate with: openssl rand -base64 32>

ALLOWED_ORIGIN=http://localhost:3000        # CORS origin
```

### 5. Initialize Database
```bash
npx prisma migrate dev
npx prisma db seed  # Optional: seed test data
```

### 6. Generate Prisma Client
```bash
npx prisma generate
```

### 7. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

### 8. Run Tests
```bash
npm test
```

## Troubleshooting

### Database Connection Error
- For SQLite: Ensure `prisma/dev.db` is writable
- For PostgreSQL: Check it is running with `pg_isready`
- Verify `DATABASE_URL` in `.env`
- Check credentials match your database setup

### OpenAI API Errors
- Verify API key is valid and has credits
- Confirm model name is correct (`gpt-4o` or `gpt-4o-mini`)
- Check for rate limiting (429 errors)

### Prisma Errors
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply pending migrations
- If SQLite migration fails, delete `prisma/dev.db` and re-run migrate

### Build Errors
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: must be 18+

## Architecture

The system uses an 8-layer AI architecture:

| Layer | Purpose |
|-------|---------|
| Layer 1 | Parsing & Entity Extraction |
| Layer 2 | Normalization & Gap Analysis |
| Layer 3 | Execution Engine (Evidence-Anchored Rewriting) |
| Layer 4 | State & Pipeline Management |
| Layer 5 | Application & Tracking |
| Layer 6 | Job Matching & Ranking |
| Layer 7 | Insights & Analytics |
| Layer 8 | Tone & Coaching |

## Next Steps

- Read `COMPREHENSIVE_AUDIT_REPORT.md` for system health status
- See API routes in `app/api/` for endpoint documentation
- Check `lib/layers/` for the core AI architecture
