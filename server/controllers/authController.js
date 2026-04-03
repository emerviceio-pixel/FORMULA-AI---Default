const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  // Google OAuth Authentication
  async googleAuth(req, res) {
    try {
      const { token } = req.body;
      
      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;
      
      // Check if user exists
      let user = await User.findOne({ googleId });
      
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          await user.save();
        }
      }
      
      if (user) {
        // Returning user - check if PIN is set
        req.session.userId = user._id;
        req.session.isNewUser = false;
        
        return res.json({
          success: true,
          isNewUser: false,
          hasPin: true,
          userId: user._id
        });
      } else {
        // New user - store in session for profile setup
        req.session.tempUser = {
          googleId,
          email,
          name,
          picture
        };
        req.session.isNewUser = true;
        
        return res.json({
          success: true,
          isNewUser: true,
          tempUser: {
            email,
            name,
            picture
          }
        });
      }
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  // Setup PIN and Recovery Word
  async setupPin(req, res) {
    try {
      const { pin, recoveryWord } = req.body;
      const tempUser = req.session.tempUser;
      
      if (!tempUser) {
        return res.status(400).json({
          success: false,
          error: 'Session expired'
        });
      }
      
      // Generate salts and hash PIN
      const pinSalt = await bcrypt.genSalt(10);
      const pinHash = await bcrypt.hash(pin, pinSalt);
      
      const recoverySalt = await bcrypt.genSalt(10);
      const recoveryHash = await bcrypt.hash(recoveryWord, recoverySalt);
      
      // Create new user
      const user = new User({
        googleId: tempUser.googleId,
        email: tempUser.email,
        nickname: tempUser.name.split(' ')[0],
        pinHash,
        pinSalt,
        recoveryWordHash: recoveryHash,
        recoveryWordSalt: recoverySalt
      });
      
      await user.save();
      
      // Update session
      req.session.userId = user._id;
      delete req.session.tempUser;
      req.session.isNewUser = false;
      
      res.json({
        success: true,
        userId: user._id,
        message: 'PIN setup successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to setup PIN'
      });
    }
  }

  // Get PIN attempt status
  async getPinAttempts(req, res) {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const now = new Date();
      const isLocked = user.pinLockoutUntil && user.pinLockoutUntil > now;
      const remainingTime = isLocked ? Math.ceil((user.pinLockoutUntil - now) / 1000) : 0;
      
      res.json({
        success: true,
        attempts: user.pinAttempts,
        locked: isLocked,
        remainingTime
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get attempt status'
      });
    }
  }

  // Verify PIN
  async verifyPin(req, res) {
    try {
      const { pin } = req.body;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const result = await user.verifyPinWithAttempts(pin);
      
      if (result.success) {
        req.session.isAuthenticated = true;
        req.session.lastPinVerified = Date.now();
        
        res.json({
          success: true,
          message: 'PIN verified',
          attempts: result.attempts
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.locked ? `Too many attempts. Try again in ${result.remainingTime} seconds.` : 'Invalid PIN',
          attempts: result.attempts,
          locked: result.locked,
          remainingTime: result.remainingTime
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Verification failed'
      });
    }
  }

  // Reset PIN with recovery word
 async resetPin(req, res) {
  try {
    const { recoveryWord, newPin } = req.body;
    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    
    // Verify recovery word
    const isValid = await user.verifyRecoveryWord(recoveryWord);
    
    if (!isValid) throw new Error('Invalid recovery word');
    
    // Generate new PIN hash
    const pinSalt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPin, pinSalt);
    
    // Update user
    user.pinSalt = pinSalt;
    user.pinHash = pinHash;
    
    // Reset PIN attempts
    await user.resetPinAttempts();
        
    // Verify it was saved
    const updatedUser = await User.findById(userId);    
    res.json({ success: true, message: 'PIN reset successful' });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

  // Logout
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Logout failed'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  }
}

module.exports = new AuthController();