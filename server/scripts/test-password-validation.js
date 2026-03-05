const http = require('http');

function testPasswordValidation() {
  const testCases = [
    { email: 'qa@testing.com', password: 'qa123' },
    { email: 'qa@testing.com', password: 'password123' },
    { email: 'qa@testing.com', password: 'admin123' }
  ];

  testCases.forEach((testCase, index) => {
    const postData = JSON.stringify(testCase);

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
      console.log(`\nTest Case ${index + 1}: ${testCase.email} / ${testCase.password}`);
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Login successful!');
            console.log('User:', parsedData.user.email, '-', parsedData.user.role);
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
  });
}

console.log('🔍 Testing password validation...');
testPasswordValidation();
