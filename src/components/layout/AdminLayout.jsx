import { useEffect, useMemo, useState, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, Sun, Moon, ChevronRight, LayoutDashboard, Users, GraduationCap, Layers, BookOpen, CheckSquare, ClipboardList, Wallet, Megaphone, BarChart3, Settings, Folder } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationDrawer } from '../ui/NotificationDrawer'

const navItems = [
  { label: 'Dashboard', to: '/a/dashboard', icon: LayoutDashboard, roles: ['admin','teacher','student'] },
  { label: 'Students', to: '/a/students', icon: Users, roles: ['admin','teacher'] },
  { label: 'Teachers', to: '/a/teachers', icon: GraduationCap, roles: ['admin'] },
  { label: 'Classes', to: '/a/classes', icon: Layers, roles: ['admin','teacher'] },
  { label: 'Subjects', to: '/a/subjects', icon: BookOpen, roles: ['admin','teacher'] },
  { label: 'Attendance', to: '/a/attendance', icon: CheckSquare, roles: ['admin','teacher'] },
  { label: 'CBT (Exams)', to: '/a/cbt', icon: ClipboardList, roles: ['admin','teacher'] },
  { label: 'Fees', to: '/a/finance', icon: Wallet, roles: ['admin'] },
  { label: 'Payments', to: '/a/payments', icon: Wallet, roles: ['admin'] },
  { label: 'Analytics', to: '/a/analytics', icon: BarChart3, roles: ['admin'] },
/*   { label: 'Notifications', to: '/a/notifications', icon: Megaphone, roles: ['admin','teacher'] },
  { label: 'Reports & Analytics', to: '/a/reports', icon: BarChart3, roles: ['admin'] }, 
  { label: 'Grades Report', to: '/a/grades-report', icon: BarChart3, roles: ['admin'] },
  { label: 'Term Results', to: '/a/term-results', icon: BarChart3, roles: ['admin'] },
  { label: 'Reviews', to: '/a/reviews', icon: Megaphone, roles: ['admin'] },
  { label: 'Files', to: '/a/files', icon: Folder, roles: ['admin'] }, */
  { label: 'Settings', to: '/a/settings', icon: Settings, roles: ['admin'] },
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

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, setIsDark } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { role, user } = useAuth()

  const filteredNav = useMemo(() => {
    if (!role) return navItems
    return navItems.filter((n) => !n.roles || n.roles.includes(role))
  }, [role])

  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const out = []
    let path = ''
    for (const p of parts) {
      path += `/${p}`
      out.push({ label: p.replace('-', ' '), to: path })
    }
    return out
  }, [location.pathname])

  const [notifOpen, setNotifOpen] = useState(false)

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

  // Workaround for linter false positive on `motion` import usage
  const MotionDiv = motion.div

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="fixed top-0 inset-x-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur z-40">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center gap-3">
          <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle Sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/a/dashboard" className="flex items-center gap-2 font-semibold">
            <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-6 w-6 object-contain" />
            <span className="hidden sm:inline">School Admin</span>
          </Link>
          <div className="hidden md:flex ml-6 flex-1 items-center gap-2 max-w-xl">
            <div className="relative w-full">
              <input className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Search..." />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
            <Bell className="h-5 w-5" />
            {/* Notifications are now handled by NotificationDrawer */}
          </button>
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800" onClick={() => setProfileOpen(v => !v)}>{user?.name || 'Account'}</button>
            <AnimatePresence>
              {profileOpen && (
                <MotionDiv initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow">
                  <Link className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/a/settings" onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/a/settings" onClick={() => setProfileOpen(false)}>Settings</Link>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleLogout}>Logout</button>
                </MotionDiv>
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

      <aside className={`fixed top-16 bottom-0 left-0 w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} aria-label="Sidebar navigation">
        <nav className="p-3 space-y-1 overflow-y-auto h-full">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
            <Link key={item.label} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={() => setSidebarOpen(false)} aria-current={isActive ? 'page' : undefined}>
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          )})}
        </nav>
      </aside>

      <main className="pt-16 md:pl-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1 mb-4">
            <Link to="/a/dashboard" className="hover:underline">Home</Link>
            {crumbs.map((c) => (
              <span key={c.to} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <Link to={c.to} className="hover:underline capitalize">{c.label}</Link>
              </span>
            ))}
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
