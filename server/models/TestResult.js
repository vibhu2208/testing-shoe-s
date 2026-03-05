module.exports = (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    executionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'test_executions',
        key: 'id'
      }
    },
    parameterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'template_parameters',
        key: 'id'
      }
    },
    observedValue: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    result: {
      type: DataTypes.ENUM('pass', 'fail'),
      allowNull: false
    },
    comments: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'test_results',
    timestamps: true,
    indexes: [
      {
        fields: ['executionId']
      },
      {
        fields: ['parameterId']
      }
    ]
  });

  TestResult.associate = function(models) {
    TestResult.belongsTo(models.TestExecution, {
      foreignKey: 'executionId',
      as: 'execution'
    });
    
    TestResult.belongsTo(models.TemplateParameter, {
      foreignKey: 'parameterId',
      as: 'parameter'
    });
  };

  return TestResult;
};
