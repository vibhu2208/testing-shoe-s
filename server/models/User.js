const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'tester', 'qa_manager', 'company'),
      allowNull: false,
      defaultValue: 'tester'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  User.associate = function(models) {
    User.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    User.hasMany(models.TestAssignment, {
      foreignKey: 'assignedTesterId',
      as: 'assignedTests'
    });
    
    User.hasMany(models.TestAssignment, {
      foreignKey: 'assignedById',
      as: 'createdAssignments'
    });
    
    User.hasMany(models.TestExecution, {
      foreignKey: 'testerId',
      as: 'testExecutions'
    });
    
    User.hasMany(models.TestExecution, {
      foreignKey: 'qaManagerId',
      as: 'qaApprovals'
    });

    // Many-to-many relationship for multiple test assignments
    User.belongsToMany(models.TestAssignment, {
      through: models.TestAssignmentTester,
      foreignKey: 'testerId',
      otherKey: 'testAssignmentId',
      as: 'testAssignments'
    });

    User.hasMany(models.TestAssignmentTester, {
      foreignKey: 'testerId',
      as: 'assignmentTesters'
    });
  };

  return User;
};
