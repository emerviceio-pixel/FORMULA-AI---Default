// src/services/authService.js (REFACTORED)
import { apiFetch } from './api';

class AuthService {
  async googleAuth(token) {
    return await apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ token }) });
  }

  async checkSession() {
    return await apiFetch('/auth/session');
  }

  async getProfile() {
    return await apiFetch('/profile');
  }

  async updateProfile(profileData) {
    return await apiFetch('/profile', { method: 'PUT', body: JSON.stringify(profileData) });
  }

  async updateSettings(settings) {
    return await apiFetch('/profile/settings', { method: 'PUT', body: JSON.stringify(settings) });
  }

  async getCurrentUser() {
    return await apiFetch('/auth/me');
  }

  async logout() {
    const result = await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('Fomula_auth');
    return result;
  }

  async deleteAccount(reason, feedback) {
    return await apiFetch('/settings/account', { 
      method: 'DELETE', 
      body: JSON.stringify({ reason, feedback }) 
    });
  }
}

export default new AuthService();