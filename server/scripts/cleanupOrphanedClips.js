import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function cleanupOrphanedClips() {
  try {
    console.log('🧹 Cleaning up orphaned clips (clips without cloud URLs or local files)...\n');

    // Find clips without cloud URLs
    const result = await pool.query(`
      SELECT id, title, file_path, cloud_url 
      FROM clips 
      WHERE cloud_url IS NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} clips without cloud URLs\n`);
    
    let deletedCount = 0;
    
    for (const clip of result.rows) {
      // Check if local file exists
      const filePath = clip.file_path;
      const fileExists = fs.existsSync(filePath);
      
      if (!fileExists) {
        console.log(`❌ Deleting orphaned clip: ${clip.title}`);
        console.log(`   File not found: ${filePath}`);
        
        // Delete from database
        await pool.query('DELETE FROM clips WHERE id = $1', [clip.id]);
        deletedCount++;
      } else {
        console.log(`✓ Keeping clip (file exists): ${clip.title}`);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} orphaned clips\n`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanupOrphanedClips();
