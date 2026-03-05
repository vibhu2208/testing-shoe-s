const { sequelize, TestAssignmentTester, TestAssignment } = require('../models');
const { Op } = require('sequelize');

async function createJunctionTable() {
  try {
    console.log('Creating test_assignment_testers junction table...');
    
    // Use Sequelize sync to create the table with proper column names
    await TestAssignmentTester.sync({ force: false });
    
    console.log('Junction table created successfully!');
    
    // Populate junction table with existing assignments
    console.log('Populating junction table with existing assignments...');
    
    // Get all existing assignments
    const existingAssignments = await TestAssignment.findAll({
      where: {
        assignedTesterId: { [Op.ne]: null }
      },
      attributes: ['id', 'assignedTesterId', 'assignedAt', 'createdAt', 'updatedAt']
    });
    
    // Create junction table entries for existing assignments
    const junctionEntries = existingAssignments.map(assignment => ({
      testAssignmentId: assignment.id,
      testerId: assignment.assignedTesterId,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    }));
    
    if (junctionEntries.length > 0) {
      await TestAssignmentTester.bulkCreate(junctionEntries, {
        ignoreDuplicates: true
      });
      console.log(`Populated junction table with ${junctionEntries.length} existing assignments`);
    } else {
      console.log('No existing assignments to populate');
    }
    
    console.log('Junction table populated successfully!');
    
  } catch (error) {
    console.error('Error creating junction table:', error);
    throw error;
  }
}

// Run the migration
createJunctionTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
