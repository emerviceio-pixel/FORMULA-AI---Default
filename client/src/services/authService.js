//client/src/service/authService.js

class AuthService {
  // Use relative paths (Vite proxy handles it)
  getBaseUrl() {
    return '';
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Critical for session cookies
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }
    
    return response.json();
  }

  // Google Auth - NO TOKEN STORAGE
  async googleAuth(token) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include'
  });

    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Google authentication failed');
    }
    
    // Store minimal user data (NO JWT)
    if (data.userId) {
      const user = { id: data.userId };
      localStorage.setItem('Fomula_auth', JSON.stringify({
        user,
        isAuthenticated: !data.isNewUser,
        timestamp: Date.now()
      }));
      
      if (data.isNewUser) {
        localStorage.setItem('tempUser', JSON.stringify(data.tempUser));
      }
    }
    
    return data;
  }

  // Verify PIN - NO TOKEN
  async verifyPin(pin) {
    const data = await this.makeRequest('/api/auth/verify-pin', 'POST', { pin });
    if (data.success) {
      // Update auth state
      localStorage.setItem('Fomula_auth', JSON.stringify({
        user: { id: data.userId },
        isAuthenticated: true,
        timestamp: Date.now()
      }));
    }
    return data;
  }

  // Get PIN attempt status
  async getPinAttemptStatus() {
    return await this.makeRequest('/api/auth/pin-attempts', 'GET');
  }

  // Setup PIN - NO TOKEN
  async setupPin(pin, recoveryWord) {
    const data = await this.makeRequest('/api/auth/setup-pin', 'POST', { pin, recoveryWord });
    if (data.success) {
      localStorage.setItem('Fomula_auth', JSON.stringify({
        user: { id: data.userId },
        isAuthenticated: true,
        timestamp: Date.now()
      }));
      localStorage.removeItem('tempUser');
    }
    return data;
  }

  // Check session status
  async checkSession() {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/auth/session`, {
        credentials: 'include'
      });
      return await response.json();
    } catch {
      return { success: false, isAuthenticated: false };
    }
  }

  // Get profile
  async getProfile() {
    return await this.makeRequest('/api/profile');
  }

  // Update profile
  async updateProfile(profileData) {
    return await this.makeRequest('/api/profile', 'PUT', profileData);
  }

  // Update settings
  async updateSettings(settings) {
    return await this.makeRequest('/api/profile/settings', 'PUT', settings);
  }

  // Logout
  async logout() {
    const result = await this.makeRequest('/api/auth/logout', 'POST');
    localStorage.removeItem('Fomula_auth');
    localStorage.removeItem('tempUser');
    return result;
  }

  async deleteAccount(reason, feedback) {
    return await this.makeRequest('/api/settings/account', 'DELETE', { reason, feedback });
  }

  // Reset PIN
  async resetPin(recoveryWord, newPin) {
    return await this.makeRequest('/api/auth/reset-pin', 'POST', { recoveryWord, newPin });
  }
}

export default new AuthService();
