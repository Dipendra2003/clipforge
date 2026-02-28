import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkClipPaths() {
  try {
    const result = await pool.query('SELECT id, title, file_path FROM clips LIMIT 10');
    
    console.log('\n📊 Clip File Paths in Database:\n');
    result.rows.forEach(clip => {
      console.log(`ID: ${clip.id}`);
      console.log(`Title: ${clip.title}`);
      console.log(`Path: ${clip.file_path}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkClipPaths();
