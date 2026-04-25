// src/services/api.js (UPDATED)
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL;
  
  const res = await fetch(`${baseUrl}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
    ...options,
  });

  // ✅ Session expiration handling at BASE level
  if (res.status === 401) {
    const errorData = await res.json().catch(() => ({}));
    
    if (errorData.sessionExpired) {
      localStorage.removeItem('Fomula_auth');
      window.location.href = '/onboarding';
      throw new Error('Session expired. Please login again.');
    }
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  } else {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${text.slice(0,100)}`);
  }
};