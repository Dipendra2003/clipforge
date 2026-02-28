import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../migrations/reset_and_create_all_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL script...\n');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All old videos and clips deleted');
    console.log('   - All tables recreated with fresh schema');
    console.log('   - Indexes and triggers set up');
    console.log('   - Admin user created (admin@example.com / admin123)');
    console.log('\n🎉 Database is ready for use!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
