const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  try {
    console.log('Starting user seeding...');

    // Check if users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log(`Found ${existingUsers} existing users. Skipping seed.`);
      return;
    }

    // Create default users
    const defaultUsers = [
      {
        email: 'admin@testing.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true
      },
      {
        email: 'qa@testing.com',
        password: 'qa123',
        firstName: 'QA',
        lastName: 'Manager',
        role: 'qa_manager',
        isActive: true
      },
      {
        email: 'tester1@testing.com',
        password: 'tester123',
        firstName: 'John',
        lastName: 'Tester',
        role: 'tester',
        isActive: true
      },
      {
        email: 'tester2@testing.com',
        password: 'tester123',
        firstName: 'Jane',
        lastName: 'Tester',
        role: 'tester',
        isActive: true
      },
      {
        email: 'company@testing.com',
        password: 'company123',
        firstName: 'Company',
        lastName: 'User',
        role: 'company',
        isActive: true
      }
    ];

    // Create users
    for (const userData of defaultUsers) {
      const user = await User.create(userData);
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('✅ User seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@testing.com / admin123');
    console.log('QA Manager: qa@testing.com / qa123');
    console.log('Tester 1: tester1@testing.com / tester123');
    console.log('Tester 2: tester2@testing.com / tester123');
    console.log('Company: company@testing.com / company123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

// Run the seeding if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedUsers;
