const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

// Function to create an admin user
async function createAdminUser() {
  try {
    // Authenticate and sync
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: {
        role: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Employee ID:', existingAdmin.emp_id);
      console.log('Role:', existingAdmin.role);
      return;
    }
    
    // Admin user details
    const adminDetails = {
      emp_id: 'ADMIN001',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@pai-erp.com',
      password_hash: '', // Will be hashed
      role: 'admin',
      status: 'active'
    };
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password = 'Admin@123'; // Default admin password
    adminDetails.password_hash = await bcrypt.hash(password, salt);
    
    // Create the admin user
    const adminUser = await User.create(adminDetails);
    
    console.log('Admin user created successfully!');
    console.log('=====================================');
    console.log('Admin Credentials:');
    console.log('Email:', adminUser.email);
    console.log('Employee ID:', adminUser.emp_id);
    console.log('Password:', password);
    console.log('Role:', adminUser.role);
    console.log('=====================================');
    console.log('Please change the default password after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
createAdminUser();