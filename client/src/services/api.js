// src/services/api.js
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL; // points backend
  const res = await fetch(`${baseUrl}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  } else {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${text.slice(0,100)}`);
  }
};
