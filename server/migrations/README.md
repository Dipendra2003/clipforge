# Database Migrations

This folder contains the complete database schema and migration scripts for ClipForge.

## Files

- `schema.sql` - Complete database schema with all tables, indexes, triggers, and analytics
- `run-migrations.js` - Node.js script to execute migrations programmatically

## Running Migrations

### Method 1: Using npm script (Recommended)
```bash
cd server
npm run migrate
```

### Method 2: Direct execution
```bash
cd server
node migrations/run-migrations.js
```

### Method 3: Using psql (if available)
```bash
psql $DATABASE_URL -f migrations/schema.sql
```

## What Gets Created

### Tables (8 total)
1. **users** - User accounts (email/password + Google OAuth)
2. **sessions** - Refresh tokens for multi-device support
3. **tokens** - Email verification and password reset tokens
4. **videos** - Uploaded and downloaded videos
5. **clips** - AI-generated viral clips
6. **platform_connections** - Social media OAuth tokens
7. **published_posts** - Posted content tracking with analytics
8. **analytics_snapshots** - Daily analytics data for time-series analysis

### Indexes (30+ total)
- Optimized indexes for all foreign keys
- Performance indexes for common queries
- Composite indexes for complex lookups
- Analytics-specific indexes for reporting

### Triggers (5 total)
- Auto-update `updated_at` timestamp on all tables

### Default Data
- Admin user account:
  - Email: `dipendrak299@gmail.com`
  - Password: (set via `createAdmin.js` script)
  - ⚠️ **Run `node scripts/createAdmin.js` to set up admin credentials**

## Database Requirements

- PostgreSQL 12+
- UUID extension (auto-installed)
- JSONB support

## Environment Variables

Make sure these are set in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Troubleshooting

### Connection Error
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Verify network access to database

### Permission Error
- Ensure database user has CREATE privileges
- Check if tables already exist (migrations will drop and recreate)

### Syntax Error
- Ensure PostgreSQL version is 12+
- Check for special characters in connection string

## Notes

- Running migrations will **DROP ALL EXISTING TABLES**
- All data will be lost when re-running migrations
- Migrations are idempotent (safe to run multiple times)
- Use in development only - production needs proper migration strategy
- Analytics columns are included in the main schema (no separate migration needed)
