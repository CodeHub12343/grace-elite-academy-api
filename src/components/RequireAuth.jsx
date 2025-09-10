import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ roles = [], children }) {
  const { user, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles.length && !roles.includes(role)) return <Navigate to="/unauthorized" replace />
  return children
}

export function PublicOnly({ children }) {
  const { user, role } = useAuth()
  if (user) {
    // Redirect to appropriate dashboard based on role
    switch (role) {
      case 'admin':
        return <Navigate to="/a/dashboard" replace />
      case 'teacher':
        return <Navigate to="/t" replace />
      case 'student':
        return <Navigate to="/s" replace />
      default:
        return <Navigate to="/" replace />
    }
  }
  return children
}