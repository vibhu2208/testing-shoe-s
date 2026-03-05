const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function testQALogin() {
  try {
    console.log('🔍 Testing QA login credentials...\n');
    
    // Find QA user in database
    const qaUser = await User.findOne({
      where: { email: 'qa@testing.com' }
    });
    
    if (!qaUser) {
      console.log('❌ QA user not found in database');
      return;
    }
    
    console.log('✅ QA user found:');
    console.log('   Email:', qaUser.email);
    console.log('   Role:', qaUser.role);
    console.log('   Active:', qaUser.isActive);
    console.log('   ID:', qaUser.id);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('qa123', qaUser.password);
    console.log('   Password valid:', isPasswordValid ? '✅' : '❌');
    
    if (!isPasswordValid) {
      console.log('\n🔧 Attempting to fix password...');
      const hashedPassword = await bcrypt.hash('qa123', 12);
      await qaUser.update({ password: hashedPassword });
      console.log('✅ Password updated successfully');
    }
    
    // Check all users
    console.log('\n📊 All users in database:');
    const allUsers = await User.findAll({
      attributes: ['email', 'role', 'isActive', 'createdAt']
    });
    
    allUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing QA login:', error);
  }
}

testQALogin();
