import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-sm">
      <div>
        <div className="text-2xl font-semibold mb-2">404</div>
        <div>Page not found.</div>
      </div>
    </div>
  )
}