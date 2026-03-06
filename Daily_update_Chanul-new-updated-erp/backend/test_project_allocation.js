const { sequelize } = require('./src/models');

async function checkTableStructure() {
  try {
    console.log('Checking project_allocation table structure...');
    
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'project_allocation'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n=== PROJECT_ALLOCATION TABLE STRUCTURE ===');
    results.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | Nullable: ${col.IS_NULLABLE} | Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
    });
    console.log('==========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
