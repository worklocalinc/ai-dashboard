# SparkAI Gateway Dashboard

A web dashboard for the SparkAI Gateway built with Next.js 15, featuring:

- Google OAuth login with admin approval workflow
- Model catalog with full details
- API key management (generate, revoke, per-project)
- Usage tracking with costs
- Model comparison arena
- Admin panel for user and model management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Auth.js v5 (NextAuth) with Google provider
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for session encryption
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `LITELLM_URL` - LiteLLM gateway URL
- `LITELLM_MASTER_KEY` - LiteLLM master API key
- `ADMIN_EMAIL` - Email of the default admin user

### 3. Set Up Database

Push the schema to your database:

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Drizzle Studio

## Deployment

### Vercel

```bash
vercel deploy --prod
```

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy .next
```

## User Roles

- **pending** - New users awaiting approval
- **user** - Approved users with dashboard access
- **admin** - Full access including user management

The first user with the `ADMIN_EMAIL` is automatically approved as admin.
