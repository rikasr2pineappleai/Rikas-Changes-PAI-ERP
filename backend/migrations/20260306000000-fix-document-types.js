'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting document cleanup and fix migration...');
    
    // Step 1: Fix incorrect document_type values
    const [documents] = await queryInterface.sequelize.query(`
      SELECT * FROM documents WHERE document_type IN ('birth', 'edu')
    `);
    
    if (documents && documents.length > 0) {
      console.log(`Found ${documents.length} documents with incorrect document_type values`);
      
      for (const doc of documents) {
        let newType = doc.document_type;
        
        if (doc.document_type === 'birth') {
          newType = 'birth_certificate';
        } else if (doc.document_type === 'edu') {
          newType = 'educational_certificate';
        }
        
        await queryInterface.sequelize.query(`
          UPDATE documents 
          SET document_type = '${newType}' 
          WHERE id = ${doc.id}
        `);
        
        console.log(`Updated document ${doc.id}: ${doc.document_type} → ${newType}`);
      }
      
      console.log('Migration completed successfully');
    } else {
      console.log('No documents found with incorrect document_type values');
    }
    
    // Step 2: Remove duplicate documents (keep only the most recent one per user per type)
    console.log('Checking for duplicate documents...');
    
    const [duplicateCheck] = await queryInterface.sequelize.query(`
      SELECT user_id, document_type, COUNT(*) as count
      FROM documents
      GROUP BY user_id, document_type
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck && duplicateCheck.length > 0) {
      console.log(`Found ${duplicateCheck.length} user/document-type combinations with duplicates`);
      
      for (const dup of duplicateCheck) {
        console.log(`Cleaning duplicates for user ${dup.user_id}, type ${dup.document_type}...`);
        
        // Get all documents for this user and type, ordered by ID descending (newest first)
        const [allDocs] = await queryInterface.sequelize.query(`
          SELECT id, file_path FROM documents 
          WHERE user_id = ${dup.user_id} AND document_type = '${dup.document_type}'
          ORDER BY id DESC
        `);
        
        if (allDocs && allDocs.length > 1) {
          // Keep the first one (newest), delete the rest
          const toDelete = allDocs.slice(1);
          
          for (const docToDelete of toDelete) {
            console.log(`  Deleting duplicate document ${docToDelete.id}`);
            
            // Try to delete the file from disk (best effort)
            try {
              const fs = require('fs');
              const path = require('path');
              const fullPath = path.join(__dirname, '..', docToDelete.file_path);
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`    ✓ Deleted file: ${fullPath}`);
              }
            } catch (fileError) {
              console.error(`    ⚠ Could not delete file: ${docToDelete.file_path}`, fileError.message);
            }
            
            // Delete the database record
            await queryInterface.sequelize.query(`
              DELETE FROM documents WHERE id = ${docToDelete.id}
            `);
          }
          
          console.log(`  ✓ Cleaned up ${toDelete.length} duplicate(s) for user ${dup.user_id}`);
        }
      }
      
      console.log('✓ Duplicate cleanup completed successfully');
    } else {
      console.log('No duplicate documents found');
    }
    
    console.log('Migration completed successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // No rollback needed as this is a data fix
    console.log('Rollback not supported for data migration');
  }
};
