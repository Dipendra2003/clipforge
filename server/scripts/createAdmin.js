import User from '../models/User.js';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔧 Starting admin setup...\n');

    // Step 1: Remove admin role from all existing users
    console.log('📋 Step 1: Removing admin role from all users...');
    const removeAdminQuery = 'UPDATE users SET role = $1 WHERE role = $2 RETURNING email';
    const removedAdmins = await pool.query(removeAdminQuery, ['user', 'admin']);
    
    if (removedAdmins.rows.length > 0) {
      console.log(`✓ Removed admin role from ${removedAdmins.rows.length} user(s):`);
      removedAdmins.rows.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    } else {
      console.log('   No existing admins found');
    }

    console.log('\n📋 Step 2: Creating new admin user...');

    const adminEmail = 'dipendrak299@gmail.com';
    const adminPassword = 'Clipadmin76@';
    const adminName = 'Admin User';

    // Check if user already exists
    const existingUser = await User.findByEmail(adminEmail);
    
    if (existingUser) {
      console.log('⚠️  User already exists, updating to admin role...');
      
      // Update to admin role and verify email
      const query = 'UPDATE users SET role = $1, email_verified = true WHERE id = $2 RETURNING *';
      const result = await pool.query(query, ['admin', existingUser.id]);
      console.log('✓ Updated user to admin role');
      console.log('   User ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
    } else {
      // Create new admin user
      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });

      // Verify email automatically for admin
      await User.verifyEmail(admin.id);

      console.log('✓ Admin user created successfully!');
      console.log('   User ID:', admin.id);
      console.log('   Email:', adminEmail);
      console.log('   Role: admin');
    }

    console.log('\n✅ Admin setup completed!\n');
    console.log('📝 Admin Login Credentials:');
    console.log('   Email: dipendrak299@gmail.com');
    console.log('   Password: Clipadmin76@');
    console.log('   Login URL: http://localhost:5173/login');
    console.log('   After login, you will be redirected to: /admin/dashboard\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
