const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function fixQAPassword() {
  try {
    console.log('🔧 Fixing QA password to meet minimum length requirements...\n');
    
    // Find QA user
    const qaUser = await User.findOne({
      where: { email: 'qa@testing.com' }
    });
    
    if (!qaUser) {
      console.log('❌ QA user not found');
      return;
    }
    
    // Update password to "qa123456" (meets 6 character minimum)
    const newPassword = 'qa123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await qaUser.update({ password: hashedPassword });
    
    console.log('✅ QA password updated successfully!');
    console.log('New credentials:');
    console.log('Email: qa@testing.com');
    console.log('Password: qa123456');
    
    // Test the new password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification:', isValid ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error fixing QA password:', error);
  }
}

fixQAPassword();
