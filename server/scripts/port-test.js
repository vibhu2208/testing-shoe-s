const net = require('net');

function testPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log(`✅ Port ${port} is accessible on ${host}`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ Port ${port} connection timed out on ${host}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ Port ${port} not accessible on ${host}: ${err.message}`);
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function testRDSConnectivity() {
  console.log('🔍 Testing AWS RDS port connectivity...\n');
  
  const host = 'testing.ch0284o4gjkn.ap-south-1.rds.amazonaws.com';
  const port = 5432;
  
  const result = await testPort(host, port);
  
  if (result) {
    console.log('\n✅ AWS RDS PostgreSQL port is accessible!');
    console.log('You should be able to connect now.');
  } else {
    console.log('\n❌ AWS RDS PostgreSQL port is not accessible.');
    console.log('Please check the following AWS RDS settings:');
    console.log('1. Security Group: Ensure inbound rule allows port 5432');
    console.log('2. Public Accessibility: Ensure it\'s set to "Yes"');
    console.log('3. VPC: Ensure proper routing and network ACLs');
  }
}

testRDSConnectivity();
