const axios = require('axios');

async function testLoginAPI() {
  try {
    console.log('🔍 Testing QA login API...\n');
    
    const loginData = {
      email: 'qa@testing.com',
      password: 'qa123'
    };
    
    console.log('Sending login request:', loginData);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLoginAPI();
