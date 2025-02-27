import pool from '../config/dbConnection.js';

const updateWorkspaceSchema = async () => {
  try {
    // Check if columns exist before adding them
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workspace' 
        AND column_name IN ('description', 'emoji', 'banner_url', 'icon_url');
    `);

    const existingColumns = result.rows.map(row => row.column_name);
    
    // Add columns that don't exist yet
    const columnsToAdd = [];
    
    if (!existingColumns.includes('description')) {
      columnsToAdd.push('ADD COLUMN IF NOT EXISTS description TEXT');
    }
    
    if (!existingColumns.includes('emoji')) {
      columnsToAdd.push('ADD COLUMN IF NOT EXISTS emoji VARCHAR(10)');
    }
    
    if (!existingColumns.includes('banner_url')) {
      columnsToAdd.push('ADD COLUMN IF NOT EXISTS banner_url TEXT');
    }
    
    if (!existingColumns.includes('icon_url')) {
      columnsToAdd.push('ADD COLUMN IF NOT EXISTS icon_url TEXT');
    }
    
    // Execute the ALTER TABLE statement if there are columns to add
    if (columnsToAdd.length > 0) {
      const alterQuery = `ALTER TABLE workspace ${columnsToAdd.join(', ')};`;
      await pool.query(alterQuery);
      console.log('Workspace schema updated successfully.');
    } else {
      console.log('Workspace schema already up to date.');
    }
    
  } catch (error) {
    console.error('Error updating workspace schema:', error);
  }
};

// Execute the migration if this file is run directly
if (require.main === module) {
  updateWorkspaceSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export default updateWorkspaceSchema;
