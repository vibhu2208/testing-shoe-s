const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('🔄 Synchronizing database schema...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database schema synchronized.');

    // Check if admin user exists
    const adminExists = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!adminExists) {
      console.log('🔄 Creating initial users...');
      
      // Create admin user
      const admin = await User.create({
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true
      });

      // Create other demo users
      await User.create({
        email: 'tester@test.com',
        password: 'tester123',
        firstName: 'John',
        lastName: 'Tester',
        role: 'tester',
        isActive: true,
        createdBy: admin.id
      });

      await User.create({
        email: 'qa@test.com',
        password: 'qa123',
        firstName: 'Jane',
        lastName: 'QA Manager',
        role: 'qa_manager',
        isActive: true,
        createdBy: admin.id
      });

      await User.create({
        email: 'company@test.com',
        password: 'company123',
        firstName: 'Company',
        lastName: 'Viewer',
        role: 'company',
        isActive: true,
        createdBy: admin.id
      });

      console.log('✅ Initial users created successfully!');
      console.log('\n📋 Demo Login Credentials:');
      console.log('Admin: admin@test.com / admin123');
      console.log('Tester: tester@test.com / tester123');
      console.log('QA Manager: qa@test.com / qa123');
      console.log('Company: company@test.com / company123');
    } else {
      console.log('✅ Admin user already exists. Skipping user creation.');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
