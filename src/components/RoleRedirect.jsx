import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RoleRedirect() {
  const { user, role } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role === 'admin') return <Navigate to="/a/dashboard" replace />
  if (role === 'teacher') return <Navigate to="/t" replace />
  if (role === 'student') return <Navigate to="/s" replace />
  return <Navigate to="/login" replace />
}

















