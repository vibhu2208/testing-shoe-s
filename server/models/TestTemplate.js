module.exports = (sequelize, DataTypes) => {
  const TestTemplate = sequelize.define('TestTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('raw', 'wip', 'finished_good'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'test_templates',
    timestamps: true
  });

  TestTemplate.associate = function(models) {
    TestTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    TestTemplate.hasMany(models.TemplateParameter, {
      foreignKey: 'templateId',
      as: 'parameters',
      onDelete: 'CASCADE'
    });
    
    TestTemplate.hasMany(models.TestAssignment, {
      foreignKey: 'templateId',
      as: 'assignments'
    });
  };

  return TestTemplate;
};
