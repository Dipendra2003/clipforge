import pool from '../config/database.js';

async function clearVideoData() {
  try {
    console.log('🗑️  Clearing all video and clip data...\n');
    
    // Delete all clips first (due to foreign key)
    const clipsResult = await pool.query('DELETE FROM clips RETURNING id');
    console.log(`✅ Deleted ${clipsResult.rowCount} clips`);
    
    // Delete all videos
    const videosResult = await pool.query('DELETE FROM videos RETURNING id');
    console.log(`✅ Deleted ${videosResult.rowCount} videos`);
    
    console.log('\n🎉 All video data cleared successfully!');
    console.log('   Tables structure is intact.');
    console.log('   Ready for fresh uploads!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing data:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the clear
clearVideoData();
