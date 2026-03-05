module.exports = (sequelize, DataTypes) => {
  const TestExecution = sequelize.define('TestExecution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assignmentId: {
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
    qaManagerId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted', 'approved', 'rejected'),
      defaultValue: 'in_progress',
      allowNull: false
    },
    overallResult: {
      type: DataTypes.ENUM('PASS', 'FAIL'),
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    submittedAt: {
      type: DataTypes.DATE
    },
    approvedAt: {
      type: DataTypes.DATE
    },
    rejectedAt: {
      type: DataTypes.DATE
    },
    qaComments: {
      type: DataTypes.TEXT
    },
    testerComments: {
      type: DataTypes.TEXT
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'test_executions',
    timestamps: true,
    indexes: [
      {
        fields: ['testerId']
      },
      {
        fields: ['qaManagerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['overallResult']
      }
    ]
  });

  TestExecution.associate = function(models) {
    TestExecution.belongsTo(models.TestAssignment, {
      foreignKey: 'assignmentId',
      as: 'assignment'
    });
    
    TestExecution.belongsTo(models.User, {
      foreignKey: 'testerId',
      as: 'tester'
    });
    
    TestExecution.belongsTo(models.User, {
      foreignKey: 'qaManagerId',
      as: 'qaManager'
    });
    
    TestExecution.hasMany(models.TestResult, {
      foreignKey: 'executionId',
      as: 'results'
    });
    
    TestExecution.hasOne(models.Report, {
      foreignKey: 'executionId',
      as: 'report'
    });
  };

  return TestExecution;
};
