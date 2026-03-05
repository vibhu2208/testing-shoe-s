module.exports = (sequelize, DataTypes) => {
  const TestAssignmentTester = sequelize.define('TestAssignmentTester', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    testAssignmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'test_assignments',
        key: 'id'
      }
    },
    testerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'test_assignment_testers',
    timestamps: true,
    underscored: true // Use snake_case column names
  });

  TestAssignmentTester.associate = function(models) {
    TestAssignmentTester.belongsTo(models.TestAssignment, {
      foreignKey: 'testAssignmentId',
      as: 'testAssignment'
    });
    
    TestAssignmentTester.belongsTo(models.User, {
      foreignKey: 'testerId',
      as: 'tester'
    });
  };

  return TestAssignmentTester;
};
