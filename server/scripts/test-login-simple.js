const http = require('http');

function testLoginAPI() {
  const postData = JSON.stringify({
    email: 'qa@testing.com',
    password: 'qa123'
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
    console.log(`Status Text: ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log('Response:', parsedData);
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

console.log('🔍 Testing QA login API...');
testLoginAPI();
