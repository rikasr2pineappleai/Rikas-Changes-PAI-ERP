// Script to clear Previous Projects and Completed Projects fields
const { User, ProjectAllocation } = require('./src/models');
const sequelize = require('../sequelize.config');

async function clearProjectFields() {
  try {
    console.log('🔍 Starting cleanup of project allocation fields...');
    
    // Option 1: Clear ALL allocations
    const result = await ProjectAllocation.update(
      {
        previous_projects: null,
        completed_projects: null
      },
      {
        where: {} // Empty where clause updates all records
      }
    );
    
    console.log('✅ Successfully cleared project fields!');
    console.log(`📊 Rows affected: ${result[0]}`);
    
    // Verify the update
    const sampleAllocations = await ProjectAllocation.findAll({
      limit: 5,
      attributes: ['id', 'user_id', 'previous_projects', 'completed_projects']
    });
    
    console.log('\n📋 Sample allocations after cleanup:');
    sampleAllocations.forEach(alloc => {
      console.log(`  - Allocation #${alloc.id}:`);
      console.log(`    previous_projects: ${alloc.previous_projects || '(empty)'}`);
      console.log(`    completed_projects: ${alloc.completed_projects || '(empty)'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing project fields:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
clearProjectFields();
