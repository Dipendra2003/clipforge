import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = path.join(__dirname, '../downloads');
const clipsDir = path.join(downloadsDir, 'clips');

function cleanupDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory doesn't exist: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip directories
    if (stat.isDirectory()) return;

    // Delete files
    try {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`🗑️ Deleted: ${file}`);
    } catch (err) {
      console.error(`❌ Error deleting ${file}:`, err.message);
    }
  });

  console.log(`\n✅ Cleaned ${deletedCount} files from ${path.basename(dir)}`);
}

console.log('🧹 Starting cleanup...\n');

// Clean main downloads folder
cleanupDirectory(downloadsDir);

// Clean clips folder
cleanupDirectory(clipsDir);

console.log('\n✨ Cleanup complete!');
