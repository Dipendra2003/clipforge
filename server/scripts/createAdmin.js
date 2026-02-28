import User from '../models/User.js';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');

    const adminEmail = 'dipendrak299@gmail.com';
    const adminPassword = 'Clipadmin76@';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingUser = await User.findByEmail(adminEmail);
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', existingUser.email);
      console.log('   Role:', existingUser.role);
      console.log('   Email Verified:', existingUser.email_verified);
      
      // Update to admin role if not already
      if (existingUser.role !== 'admin') {
        const query = 'UPDATE users SET role = $1, email_verified = true WHERE id = $2 RETURNING *';
        const result = await pool.query(query, ['admin', existingUser.id]);
        console.log('✓ Updated user to admin role');
        console.log('   User ID:', result.rows[0].id);
      }
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
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   Role: admin');
      console.log('   User ID:', admin.id);
    }

    console.log('\n📝 Admin Login Credentials:');
    console.log('   Email: dipendrak299@gmail.com');
    console.log('   Password: Clipadmin76@');
    console.log('   Login URL: http://localhost:5173/login');
    console.log('   After login, you will be redirected to: /admin/dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
