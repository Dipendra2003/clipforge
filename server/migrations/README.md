# Database Migrations

This folder contains database schema and migration scripts for ClipForge.

## 🔒 SAFE Migration (Recommended)

**Use this for production and when you have existing data!**

This migration:
- ✅ **Never drops existing tables**
- ✅ **Only adds missing tables/columns**
- ✅ **Safe for updates without data loss**
- ✅ **Works for both fresh installs and updates**

```bash
cd server
npm run migrate
```

## 🆕 Fresh Migration (Development Only)

**⚠️ WARNING: This will DROP ALL TABLES and DELETE ALL DATA!**

Use only for:
- Fresh development setup
- Resetting your local database
- Starting from scratch

```bash
cd server
npm run migrate:fresh
```

## Files

- `safe-migrate.js` - **SAFE** migration that preserves data (default)
- `run-migrations.js` - Fresh migration that drops all tables
- `schema.sql` - Complete SQL schema reference

## What Gets Created/Updated

### Tables (9 total)
1. **users** - User accounts (email/password + Google OAuth)
2. **sessions** - Refresh tokens for multi-device support
3. **tokens** - Email verification and password reset tokens
4. **videos** - Uploaded and downloaded videos
5. **clips** - AI-generated viral clips
6. **platform_connections** - Social media OAuth tokens (YouTube & Instagram)
7. **published_posts** - Posted content tracking with analytics (YouTube & Instagram)
8. **analytics_snapshots** - Daily analytics data for time-series analysis
9. **notification_preferences** - User notification settings

### Indexes (38+ total)
- Optimized indexes for all foreign keys
- Performance indexes for common queries
- Composite indexes for complex lookups
- Analytics-specific indexes for reporting
- Platform-specific indexes for YouTube & Instagram

### Triggers (6 total)
- Auto-update `updated_at` timestamp on all tables

### Platform Support
- ✅ **YouTube** - Full support with analytics
- ✅ **Instagram** - Full support with Instagram-specific metrics (reach, saves)

## Safe Migration Features

The safe migration system:

1. **Checks before creating** - Verifies if tables/columns exist
2. **Adds only what's missing** - Creates new tables/columns as needed
3. **Updates constraints** - Adds Instagram support to existing tables
4. **Preserves data** - Never drops or truncates existing data
5. **Idempotent** - Safe to run multiple times

### What it does:

- ✅ Creates missing tables
- ✅ Adds missing columns (e.g., `reach_count`, `saved_count` for Instagram)
- ✅ Updates constraints (e.g., adds 'instagram' to platform checks)
- ✅ Creates missing indexes
- ✅ Creates missing triggers
- ✅ Skips existing items

## Database Requirements

- PostgreSQL 12+
- UUID extension (auto-installed)
- JSONB support

## Environment Variables

Make sure these are set in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Migration Scenarios

### Scenario 1: Fresh Install (No existing database)
```bash
npm run migrate
```
Result: All tables, indexes, and triggers created

### Scenario 2: Update Existing Database (Add Instagram support)
```bash
npm run migrate
```
Result: 
- Existing tables preserved
- Instagram columns added (`reach_count`, `saved_count`)
- Platform constraints updated
- Missing indexes created
- No data loss

### Scenario 3: Reset Everything (Development)
```bash
npm run migrate:fresh
```
Result: All tables dropped and recreated (⚠️ DATA LOSS)

## Troubleshooting

### Connection Error
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Verify network access to database

### Permission Error
- Ensure database user has CREATE privileges
- Check ALTER TABLE permissions for updates

### Column Already Exists Error
- Safe migration handles this automatically
- Run `npm run migrate` again

## Migration History

- **v1.0** - Initial schema with YouTube support
- **v1.1** - Added Instagram support (merged into safe migration)
- **v1.2** - Added analytics enhancement
- **v2.0** - Safe migration system (no data loss)

## Best Practices

1. **Always use safe migration in production**: `npm run migrate`
2. **Backup before major updates**: `pg_dump $DATABASE_URL > backup.sql`
3. **Test migrations in development first**
4. **Use fresh migration only for local dev reset**
5. **Never run fresh migration in production**

## Notes

- Safe migration is now the default (`npm run migrate`)
- Fresh migration requires explicit command (`npm run migrate:fresh`)
- Both migrations are idempotent (safe to run multiple times)
- Instagram support is automatically added to existing databases
- All analytics columns are included
