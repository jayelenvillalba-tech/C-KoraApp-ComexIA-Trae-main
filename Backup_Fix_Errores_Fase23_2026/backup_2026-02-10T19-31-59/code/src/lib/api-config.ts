// API Configuration
// This file handles API URLs for both development and production

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiUrl = (path: string) => {
  // In development, Vite proxy handles /api requests
  // In production, we need to use the full Railway URL
  if (import.meta.env.DEV) {
    return path; // Use relative path, Vite proxy will handle it
  }
  
  // In production, prepend the API base URL
  return `${API_BASE_URL}${path}`;
};

// Helper for fetch requests
export const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(apiUrl(path), options);
};
