import { api } from './axios'

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TOKEN_EXPIRY_KEY = 'tokenExpiry'

// Token management functions
export const tokenManager = {
  // Store tokens
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    const expiryTime = Date.now() + (expiresIn * 1000)
    
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
  },

  // Get access token
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  // Check if token is expired
  isTokenExpired() {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return true
    
    // Add 5 minute buffer before expiry
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    return Date.now() >= (parseInt(expiry) - bufferTime)
  },

  // Check if token will expire soon (within 10 minutes)
  isTokenExpiringSoon() {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return true
    
    const warningTime = 10 * 60 * 1000 // 10 minutes
    return Date.now() >= (parseInt(expiry) - warningTime)
  },

  // Clear all tokens
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  // Get token expiry time
  getTokenExpiry() {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    return expiry ? parseInt(expiry) : null
  }
}

// Refresh token function
export const refreshAccessToken = async () => {
  try {
    const refreshToken = tokenManager.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/api/auth/refresh', {
      refreshToken
    })

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data

    // Store new tokens
    tokenManager.setTokens(accessToken, newRefreshToken, expiresIn)

    return accessToken
  } catch (error) {
    console.error('Failed to refresh token:', error)
    
    // Clear tokens on refresh failure
    tokenManager.clearTokens()
    
    // Redirect to login
    window.location.href = '/login'
    
    throw error
  }
}

// Automatic token refresh setup
export const setupTokenRefresh = () => {
  // Check token every minute
  const checkInterval = setInterval(() => {
    if (tokenManager.isTokenExpired()) {
      // Token is expired, try to refresh
      refreshAccessToken().catch(() => {
        // If refresh fails, clear interval and redirect
        clearInterval(checkInterval)
        window.location.href = '/login'
      })
    } else if (tokenManager.isTokenExpiringSoon()) {
      // Token will expire soon, refresh proactively
      refreshAccessToken().catch(() => {
        // If refresh fails, clear interval and redirect
        clearInterval(checkInterval)
        window.location.href = '/login'
      })
    }
  }, 60000) // Check every minute

  // Return cleanup function
  return () => clearInterval(checkInterval)
}

// Token validation utility
export const validateToken = (token) => {
  if (!token) return false
  
  try {
    // Basic JWT structure validation
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Check if payload is valid JSON
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token has expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

// Get user info from token
export const getUserFromToken = (token) => {
  if (!token) return null
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name
    }
  } catch (error) {
    console.error('Error parsing token payload:', error)
    return null
  }
}

// Token refresh interceptor for axios
export const setupAxiosTokenRefresh = (axiosInstance) => {
  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve(token)
      }
    })
    
    failedQueue = []
  }

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = tokenManager.getAccessToken()
      
      if (token && !tokenManager.isTokenExpired()) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axiosInstance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          }).catch(err => {
            return Promise.reject(err)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const newToken = await refreshAccessToken()
          processQueue(null, newToken)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )
}

// Export default token manager
export default tokenManager















