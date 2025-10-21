/// Env variable for backend. Try to read API_URL if it exists (openshift)
/// or simply localhost if we are running locally.
export const API_BASE =
  (typeof window !== 'undefined' && window.__API_URL__) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000';
