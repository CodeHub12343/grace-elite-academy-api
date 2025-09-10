import { createContext, useContext, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/axios'

const AuthContext = createContext({ user: null, role: 'guest', isLoading: true })

async function fetchProfile() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
    if (!token) return null
    
    const res = await api.get('/auth/profile')
    const raw = res.data?.user || res.data
    if (!raw) return null
    // Normalize id shape for consumers expecting _id
    return { ...raw, _id: raw._id || raw.id }
  } catch (_e) {
    // Not authenticated or server error; treat as logged out
    return null
  }
}

export function AuthProvider({ children }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60,
  })

  async function signOut() {
    try { 
      await api.post('/auth/logout') 
    } catch (_e) {}
    
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  async function refreshAuth() {
    await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
  }



  const value = useMemo(() => ({
    user: data || null,
    role: data?.role || 'guest',
    isLoading,
    signOut,
    refreshAuth,
  }), [data, isLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


