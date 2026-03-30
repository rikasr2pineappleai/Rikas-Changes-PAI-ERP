const { sequelize } = require('../models');

// Function to update all existing users with a default role
async function updateUserRoles() {
  try {
    // Authenticate and sync
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Update all users who don't have a role set
    const [results, metadata] = await sequelize.query(
      "UPDATE users SET role = 'employee' WHERE role IS NULL OR role = ''"
    );
    
    console.log(`Updated users with default role 'employee'`);
    
    // Optionally, you can set specific users as admins
    // For example, set user with emp_id 'ADMIN001' as admin:
    // const [adminResults, adminMetadata] = await sequelize.query(
    //   "UPDATE users SET role = 'admin' WHERE emp_id = 'ADMIN001'"
    // );
    // console.log(`Updated users with admin role`);
    
    console.log('User roles updated successfully!');
  } catch (error) {
    console.error('Error updating user roles:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
updateUserRoles();