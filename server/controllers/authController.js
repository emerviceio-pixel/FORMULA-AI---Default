const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  // Google OAuth Authentication - creates user immediately
  async googleAuth(req, res) {
    try {
      const { token } = req.body;
      
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
        // Existing user - log them in
        req.session.userId = user._id;
        
        return res.json({
          success: true,
          isNewUser: false,
          userId: user._id,
          isAdmin: user.admin === true
        });
      } else {
        // NEW USER: Create account immediately
        const newUser = new User({
          googleId,
          email,
          nickname: name ? name.split(' ')[0] : email.split('@')[0],
        });
        
        await newUser.save();
        
        req.session.userId = newUser._id;
        
        return res.json({
          success: true,
          isNewUser: true,
          userId: newUser._id,
          isAdmin: false,
          tempUser: {
            email,
            name,
            picture
          }
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }
      
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          isAdmin: user.admin === true,
          subscription: user.subscription
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
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