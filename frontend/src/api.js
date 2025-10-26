export const API_BASE =
  (typeof window !== 'undefined' && window.__API_URL__) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000';

if (typeof window !== 'undefined') {
  console.info("Resolved API_BASE =", API_BASE);
}
