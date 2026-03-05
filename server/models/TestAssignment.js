module.exports = (sequelize, DataTypes) => {
  const TestAssignment = sequelize.define('TestAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'test_templates',
        key: 'id'
      }
    },
    assignedTesterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('assigned', 'in_progress', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'assigned'
    },
    dueDate: {
      type: DataTypes.DATE
    },
    notes: {
      type: DataTypes.TEXT
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'test_assignments',
    timestamps: true,
    indexes: [
      {
        fields: ['assignedTesterId', 'status']
      },
      {
        fields: ['status']
      }
    ]
  });

  TestAssignment.associate = function(models) {
    TestAssignment.belongsTo(models.TestTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });
    
    // Keep backward compatibility - single tester relationship
    TestAssignment.belongsTo(models.User, {
      foreignKey: 'assignedTesterId',
      as: 'tester'
    });
    
    TestAssignment.belongsTo(models.User, {
      foreignKey: 'assignedById',
      as: 'assignedBy'
    });
    
    TestAssignment.hasMany(models.TestExecution, {
      foreignKey: 'assignmentId',
      as: 'executions'
    });

    // New many-to-many relationship for multiple testers
    TestAssignment.belongsToMany(models.User, {
      through: models.TestAssignmentTester,
      foreignKey: 'testAssignmentId',
      otherKey: 'testerId',
      as: 'testers'
    });

    TestAssignment.hasMany(models.TestAssignmentTester, {
      foreignKey: 'testAssignmentId',
      as: 'testerAssignments'
    });
  };

  return TestAssignment;
};
