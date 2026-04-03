// server/test/mobile-auth-test.js
const fetch = require('node-fetch');

async function testMobileLogin() {
  const loginData = {
    email: 'emerviceio@gmail.com', // Use your actual test user
    password: '1234',
    pin: '1234' // Your actual 4-digit PIN
  };

  try {
    console.log('🧪 Testing mobile login...');
    
    const response = await fetch('http://localhost:5000/api/mobile/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Mobile login successful!');
      console.log('Token:', result.data.token.substring(0, 50) + '...');
      
      // Test authenticated API call
      const authResponse = await fetch('http://localhost:5000/api/analyzer/mobile/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${result.data.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ foodName: 'banana' })
      });
      
      if (authResponse.ok) {
        console.log('✅ Authenticated API call successful!');
      } else {
        console.log('❌ Authenticated API call failed');
      }
    } else {
      console.log('❌ Mobile login failed:', result.error);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testMobileLogin();