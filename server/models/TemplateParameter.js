module.exports = (sequelize, DataTypes) => {
  const TemplateParameter = sequelize.define('TemplateParameter', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('numeric', 'text', 'dropdown', 'boolean'),
      allowNull: false
    },
    isMandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sequenceOrder: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // For numeric type
    minValue: {
      type: DataTypes.DECIMAL
    },
    maxValue: {
      type: DataTypes.DECIMAL
    },
    // For dropdown type
    dropdownOptions: {
      type: DataTypes.JSON // Array of strings
    },
    acceptableValues: {
      type: DataTypes.JSON // Array of acceptable values for pass/fail
    },
    // For text type
    maxLength: {
      type: DataTypes.INTEGER
    },
    validationPattern: {
      type: DataTypes.STRING // Regex pattern
    }
  }, {
    tableName: 'template_parameters',
    timestamps: true,
    indexes: [
      {
        fields: ['templateId', 'sequenceOrder']
      }
    ]
  });

  TemplateParameter.associate = function(models) {
    TemplateParameter.belongsTo(models.TestTemplate, {
      foreignKey: 'templateId',
      as: 'template'
    });
    
    TemplateParameter.hasMany(models.TestResult, {
      foreignKey: 'parameterId',
      as: 'results'
    });
  };

  return TemplateParameter;
};
