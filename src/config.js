// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://grace-elite-academy-api.onrender.com/api',
  TIMEOUT: 10000,
}

// Socket URL (no /api)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_CONFIG.BASE_URL.replace(/\/?api\/?$/, '')

// Environment Configuration
export const ENV_CONFIG = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} 

// Paystack Public Key (NEVER commit live secret keys; use env)
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''