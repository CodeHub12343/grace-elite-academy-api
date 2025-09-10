import { useEffect, useMemo, useState, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, Sun, Moon, ChevronRight, Home, Layers, Users, BookOpen, CheckSquare, ClipboardList, BarChart3, Megaphone, Settings, Folder } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationDrawer } from '../ui/NotificationDrawer'

const navItems = [
  { label: 'Home', to: '/t', icon: Home },
  { label: 'My Classes', to: '/t/classes', icon: Layers },
  { label: 'Students', to: '/t/students', icon: Users },
  { label: 'Subjects', to: '/t/subjects', icon: BookOpen },
/*   { label: 'Attendance', to: '/t/attendance', icon: CheckSquare },
  { label: 'Assignments', to: '/t/assignments', icon: ClipboardList }, */
  { label: 'CBT', to: '/t/cbt', icon: BarChart3 },
  { label: 'Grades & Reviews', to: '/t/grades', icon: BarChart3 },
  { label: 'Results', to: '/t/results', icon: ClipboardList },
/*   { label: 'Notifications', to: '/t/notifications', icon: Megaphone }, */
  { label: 'Profile & Settings', to: '/t/settings', icon: Settings },
]

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])
  return { isDark, setIsDark }
}

export function TeacherLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, setIsDark } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  const visibleNav = useMemo(() => navItems, [])

  // Use location directly for breadcrumbs without storing in a variable (avoid unused var)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications] = useState([])
  const [reconnecting] = useState(false)

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  useEffect(() => {
    function onDoc(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const { signOut } = useAuth()
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  // Linter usage alias for motion
  const MotionDiv = motion.div

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="fixed top-0 inset-x-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur z-40">
        <div className="h-full max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
          <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle Sidebar">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <Link to="/t" className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-6 w-6 object-contain" />
            <span className="hidden sm:inline">Teacher</span>
          </Link>
          <div className="hidden md:flex ml-4 sm:ml-6 flex-1 items-center gap-2 max-w-xl">
            <div className="relative w-full">
              <input className="w-full pl-8 sm:pl-9 pr-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Search students, classes, subjects..." />
              <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {reconnecting && <span className="text-xs px-2 py-1 rounded-md border bg-yellow-50 text-yellow-800 border-yellow-200 hidden sm:inline">Reconnecting…</span>}
          <button className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {notifications.length > 0 && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />}
          </button>
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
            {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button className="px-2 sm:px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm" onClick={() => setProfileOpen(v => !v)}>
              <span className="hidden sm:inline">{user?.name || 'Account'}</span>
              <span className="sm:hidden">{user?.name?.charAt(0) || 'A'}</span>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 mt-2 w-40 sm:w-48 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow">
                  <Link className="block px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/t/settings" onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link className="block px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/t/settings" onClick={() => setProfileOpen(false)}>Settings</Link>
                  <button className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleLogout}>Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`fixed top-16 bottom-0 left-0 w-64 sm:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} aria-label="Sidebar navigation">
        <nav className="p-2 sm:p-3 space-y-1 overflow-y-auto h-full">
          {visibleNav.map(item => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link key={item.label} to={item.to} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={() => setSidebarOpen(false)} aria-current={isActive ? 'page' : undefined}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="pt-16 md:pl-64 lg:pl-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1 mb-3 sm:mb-4 overflow-x-auto">
            <Link to="/t" className="hover:underline whitespace-nowrap">Home</Link>
            {location.pathname.split('/').filter(Boolean).slice(1).map((part, idx, arr) => {
              const to = '/' + arr.slice(0, idx + 1).join('/')
              return (
                <span key={to} className="flex items-center gap-1 whitespace-nowrap">
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                  <Link to={to} className="hover:underline capitalize">{part.replace('-', ' ')}</Link>
                </span>
              )
            })}
          </div>
          <AnimatePresence mode="wait">
            <MotionDiv key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              <Outlet />
            </MotionDiv>
          </AnimatePresence>
        </div>
      </main>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  )
}
