import axios from 'axios'
import { API_CONFIG } from '../config'

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: false,
})

// Simple token interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global 401 handler: clear tokens and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('accessToken')
      } catch {}
      if (typeof window !== 'undefined') {
        const current = window.location.pathname
        if (!current.startsWith('/auth')) {
          window.location.assign('/auth/signin')
        }
      }
    }
    return Promise.reject(error)
  }
)


