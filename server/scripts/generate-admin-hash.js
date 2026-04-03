// server/scripts/generate-admin-hash.js
const bcrypt = require('bcryptjs');
async function generateHash() {
  const password = process.argv[2]; // Pass password as argument
  
  if (!password) {
    console.log('Usage: node generate-admin-hash.js "Password"');
    process.exit(1);
  }
  
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
}

generateHash().catch(console.error);