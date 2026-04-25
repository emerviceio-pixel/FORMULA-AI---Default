// server/utils/encryption.js
require('dotenv').config();
const crypto = require('crypto');

// 32-byte key (64 hex characters)
const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.HEALTH_DATA_ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(text), 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Return as iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encryptedText) {
  if (!encryptedText) return [];
  
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      return [];
    }
    
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    return [];
  }
}

module.exports = { encrypt, decrypt };