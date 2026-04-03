// generate-key.js
const crypto = require('crypto');
console.log('HEALTH_DATA_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));