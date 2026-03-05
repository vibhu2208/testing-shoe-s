const { exec } = require('child_process');
const dns = require('dns');

async function testConnectivity() {
  console.log('🔍 Testing AWS RDS connectivity...\n');
  
  // Test DNS resolution
  console.log('1. Testing DNS resolution...');
  dns.resolve4('testing.ch0284o4gjkn.ap-south-1.rds.amazonaws.com', (err, addresses) => {
    if (err) {
      console.error('❌ DNS resolution failed:', err.message);
    } else {
      console.log('✅ DNS resolved to:', addresses);
    }
  });
  
  // Test ping
  console.log('\n2. Testing ping...');
  exec('ping -n 4 testing.ch0284o4gjkn.ap-south-1.rds.amazonaws.com', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Ping failed:', error.message);
    } else {
      console.log('✅ Ping successful:');
      console.log(stdout);
    }
  });
  
  // Test telnet to port 5432
  console.log('\n3. Testing port 5432 connectivity...');
  exec('telnet testing.ch0284o4gjkn.ap-south-1.rds.amazonaws.com 5432', { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Port 5432 not accessible:', error.message);
    } else {
      console.log('✅ Port 5432 accessible');
    }
  });
}

testConnectivity();
