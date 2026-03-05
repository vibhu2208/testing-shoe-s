const http = require('http');

function testExactRequest() {
  // Test exactly what the frontend might send
  const postData = JSON.stringify({
    email: 'qa@testing.com',
    password: 'qa123'
  });

  console.log('Request data:', postData);
  console.log('Request data length:', postData.length);

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
    console.log(`\nStatus: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
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

console.log('🔍 Testing exact request format...');
testExactRequest();
