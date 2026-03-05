module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    executionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'test_executions',
        key: 'id'
      }
    },
    reportNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    filePath: {
      type: DataTypes.STRING
    },
    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
      {
        fields: ['reportNumber']
      },
      {
        fields: ['executionId']
      }
    ]
  });

  Report.associate = function(models) {
    Report.belongsTo(models.TestExecution, {
      foreignKey: 'executionId',
      as: 'execution'
    });
    
    Report.belongsTo(models.User, {
      foreignKey: 'generatedBy',
      as: 'generator'
    });
  };

  return Report;
};
