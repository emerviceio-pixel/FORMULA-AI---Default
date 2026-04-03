// test-AI-decryption.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // 👇 Explicitly select system-encrypted fields
    const user = await User.findById('6980f7e68c5236bfb4cd593c')
      .select('+healthConditionsSystemEncrypted +allergiesSystemEncrypted');
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('Raw encrypted ');
    console.log('Conditions:', user.healthConditionsSystemEncrypted);
    console.log('Allergies:', user.allergiesSystemEncrypted);
    
    const conditions = decrypt(user.healthConditionsSystemEncrypted);
    const allergies = decrypt(user.allergiesSystemEncrypted);
    
    console.log('\nDecrypted result:');
    console.log('Conditions:', conditions);
    console.log('Allergies:', allergies);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });