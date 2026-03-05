const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

const db = {};

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.TestTemplate = require('./TestTemplate')(sequelize, Sequelize.DataTypes);
db.TemplateParameter = require('./TemplateParameter')(sequelize, Sequelize.DataTypes);
db.TestAssignment = require('./TestAssignment')(sequelize, Sequelize.DataTypes);
db.TestAssignmentTester = require('./TestAssignmentTester')(sequelize, Sequelize.DataTypes);
db.TestExecution = require('./TestExecution')(sequelize, Sequelize.DataTypes);
db.TestResult = require('./TestResult')(sequelize, Sequelize.DataTypes);
db.Report = require('./Report')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
