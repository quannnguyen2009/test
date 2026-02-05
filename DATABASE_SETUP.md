# Database Setup Guide

## Local Development (SQLite)

Your local setup uses **SQLite** for simplicity and zero cost.

**Current configuration:**
- `prisma/schema.prisma`: `provider = "sqlite"`
- `.env`: `DATABASE_URL="file:./dev.db"`

**Commands:**
```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## Production Deployment (PostgreSQL)

When deploying to Vercel/Railway, you need to switch to PostgreSQL.

### Step 1: Update schema.prisma

Change the provider to `postgresql`:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 2: Set DATABASE_URL on Vercel/Railway

In your deployment platform, set the `DATABASE_URL` environment variable to your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### Step 3: Deploy

Vercel will automatically run:
```bash
npx prisma generate
npx prisma migrate deploy
```

---

## Important Notes

1. **Don't commit `.env`** - It's already in `.gitignore`
2. **Commit `schema.prisma` as SQLite** - Change it only during deployment
3. **Alternative**: Use environment-based schema switching (advanced)

---

## Quick Switch Script

To quickly switch between SQLite and PostgreSQL:

**Switch to PostgreSQL:**
```bash
sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
```

**Switch back to SQLite:**
```bash
sed -i '' 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
```
