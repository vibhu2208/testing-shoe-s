const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    console.log('🔍 Debugging QA password issue...\n');
    
    // Find QA user
    const qaUser = await User.findOne({
      where: { email: 'qa@testing.com' }
    });
    
    if (!qaUser) {
      console.log('❌ QA user not found');
      return;
    }
    
    console.log('QA User Info:');
    console.log('Email:', qaUser.email);
    console.log('Password Hash:', qaUser.password);
    console.log('Password Length:', qaUser.password.length);
    
    // Test different password comparisons
    const testPasswords = ['qa123', 'password123', 'admin123'];
    
    console.log('\nTesting password comparisons:');
    for (const testPwd of testPasswords) {
      const isValid = await bcrypt.compare(testPwd, qaUser.password);
      console.log(`${testPwd}: ${isValid ? '✅' : '❌'}`);
    }
    
    // Test validatePassword method
    console.log('\nTesting validatePassword method:');
    for (const testPwd of testPasswords) {
      try {
        const isValid = await qaUser.validatePassword(testPwd);
        console.log(`${testPwd}: ${isValid ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`${testPwd}: ❌ Error - ${error.message}`);
      }
    }
    
    // Test creating a new hash
    console.log('\nCreating new hash for "qa123":');
    const newHash = await bcrypt.hash('qa123', 12);
    console.log('New Hash:', newHash);
    const isNewHashValid = await bcrypt.compare('qa123', newHash);
    console.log('New hash valid:', isNewHashValid ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPassword();
