const http = require('http');

function testNewQALogin() {
  const postData = JSON.stringify({
    email: 'qa@testing.com',
    password: 'qa123456'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log('✅ QA Login successful!');
          console.log('User:', parsedData.user.email, '-', parsedData.user.role);
          console.log('Token:', parsedData.token.substring(0, 50) + '...');
        } else {
          console.log('❌ Login failed:', parsedData.errors || parsedData.message);
        }
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('🔍 Testing new QA login with password "qa123456"...');
testNewQALogin();
