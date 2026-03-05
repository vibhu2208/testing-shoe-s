const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function reseedQA() {
  try {
    console.log('🔄 Reseeding QA user with correct password...\n');
    
    // Find and delete existing QA user
    const existingQA = await User.findOne({
      where: { email: 'qa@testing.com' }
    });
    
    if (existingQA) {
      await existingQA.destroy();
      console.log('Deleted existing QA user');
    }
    
    // Create new QA user with correct password
    const qaUser = await User.create({
      email: 'qa@testing.com',
      password: 'qa123456',
      firstName: 'QA',
      lastName: 'Manager',
      role: 'qa_manager',
      isActive: true
    });
    
    console.log('✅ QA user reseeded successfully!');
    console.log('Email: qa@testing.com');
    console.log('Password: qa123456');
    console.log('Role: qa_manager');
    
    // Test the password
    const isValid = await bcrypt.compare('qa123456', qaUser.password);
    console.log('Password verification:', isValid ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error reseeding QA user:', error);
  }
}

reseedQA();
