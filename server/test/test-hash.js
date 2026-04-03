// Create a test file: server/test-hash.js
const bcrypt = require('bcryptjs');

async function testHash() {
  const password = "your-actual-password"; // 👈 
  const hash = "$2a$12$Bu3Ev/duGPDWzyjmUsiuJuZZYVloucBoRrSp.2WzLLt/GmUFdzVZa"; // 👈 Your full hash from .env
  
  const isValid = await bcrypt.compare(password, hash);
  console.log("Password valid:", isValid);
}

testHash();