const { sequelize } = require('../models');
const seedUsers = require('./seed-users');

async function setupDatabase() {
  try {
    console.log('🔄 Starting database setup...');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (create tables)
    console.log('🔄 Synchronizing database schema...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database schema synchronized successfully.');
    
    // Seed users
    console.log('🔄 Seeding default users...');
    await seedUsers();
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run the setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
