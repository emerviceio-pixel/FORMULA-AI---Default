class AuthService {
  // Always use the env variable
  getBaseUrl() {
    return import.meta.env.VITE_API_URL;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
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

  // Google Auth
  async googleAuth(token) {
    return await this.makeRequest('/auth/google', 'POST', { token });
  }

  async verifyPin(pin) {
    return await this.makeRequest('/auth/verify-pin', 'POST', { pin });
  }

  async getPinAttemptStatus() {
    return await this.makeRequest('/auth/pin-attempts', 'GET');
  }

  async setupPin(pin, recoveryWord) {
    return await this.makeRequest('/auth/setup-pin', 'POST', { pin, recoveryWord });
  }

  async checkSession() {
    return await this.makeRequest('/auth/session', 'GET');
  }

  async getProfile() {
    return await this.makeRequest('/profile', 'GET');
  }

  async updateProfile(profileData) {
    return await this.makeRequest('/profile', 'PUT', profileData);
  }

  async updateSettings(settings) {
    return await this.makeRequest('/profile/settings', 'PUT', settings);
  }

  async getCurrentUser() {
    return await this.makeRequest('/auth/me', 'GET');
  }

  async logout() {
    const result = await this.makeRequest('/auth/logout', 'POST');
    localStorage.removeItem('Fomula_auth');
    localStorage.removeItem('tempUser');
    return result;
  }

  async deleteAccount(reason, feedback) {
    return await this.makeRequest('/settings/account', 'DELETE', { reason, feedback });
  }

  async resetPin(recoveryWord, newPin) {
    return await this.makeRequest('/auth/reset-pin', 'POST', { recoveryWord, newPin });
  }
}

export default new AuthService();
