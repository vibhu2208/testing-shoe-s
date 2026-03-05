'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('test_assignment_testers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      testAssignmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'test_assignments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      testerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint to prevent duplicate assignments
    await queryInterface.addIndex('test_assignment_testers', {
      fields: ['testAssignmentId', 'testerId'],
      unique: true,
      name: 'unique_test_assignment_tester'
    });

    // Add index for faster queries by testerId
    await queryInterface.addIndex('test_assignment_testers', {
      fields: ['testerId'],
      name: 'test_assignment_testers_tester_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('test_assignment_testers');
  }
};
