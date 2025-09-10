import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, Sun, Moon, ChevronRight, Home, Layers, BookOpen, ClipboardList, CheckSquare, BarChart3, Wallet, Megaphone, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { NotificationDrawer } from '../ui/NotificationDrawer'

const navItems = [
  { label: 'Home', to: '/s', icon: Home },
  { label: 'My Classes', to: '/s/classes', icon: Layers },
  { label: 'Subjects', to: '/s/subjects', icon: BookOpen },
/*   { label: 'Assignments', to: '/s/assignments', icon: ClipboardList },
  { label: 'Attendance', to: '/s/attendance', icon: CheckSquare }, */
  { label: 'Exams & CBT', to: '/s/exams', icon: BarChart3 },
  { label: 'Grades', to: '/s/grades', icon: BarChart3 },
  { label: 'Term Results', to: '/s/term-results', icon: BarChart3 },
  { label: 'Fees & Payments', to: '/s/fees', icon: Wallet },
/*   { label: 'Notifications', to: '/s/notifications', icon: Megaphone }, */
  { label: 'Profile & Settings', to: '/s/settings', icon: Settings },
]

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (isDark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light') }
  }, [isDark])
  return { isDark, setIsDark }
}

export function StudentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, setIsDark } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const out = []
    let path = ''
    for (const p of parts) { path += `/${p}`; out.push({ label: p.replace('-', ' '), to: path }) }
    return out
  }, [location.pathname])

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  
  useEffect(() => {
    function onDoc(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const { signOut } = useAuth()
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  // Use MotionDiv alias to satisfy linter usage of `motion`
  const MotionDiv = motion.div

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="fixed top-0 inset-x-0 h-14 sm:h-16 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur z-40">
        <div className="h-full max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
          <button className="md:hidden p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle Sidebar">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <Link to="/s" className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-6 w-6 object-contain" />
            <span className="hidden sm:inline">Student</span>
          </Link>
          <div className="hidden md:flex ml-4 sm:ml-6 flex-1 items-center gap-2 max-w-xl">
            <div className="relative w-full">
              <input className="w-full pl-8 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Search subjects, assignments..." />
              <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button className="relative p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {/* Notifications are now handled by NotificationDrawer */}
          </button>
          <button className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
            {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm" onClick={() => setProfileOpen(v => !v)}>Account</button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 mt-2 w-40 sm:w-48 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow">
                  <Link className="block px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/s/settings" onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link className="block px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" to="/s/settings" onClick={() => setProfileOpen(false)}>Settings</Link>
                  <button className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleLogout}>Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex pt-14 sm:pt-16">
        <aside className={`fixed inset-y-10 left-0 z-30 w-56 sm:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Sidebar navigation">
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col pt-4 sm:pt-5 pb-4 overflow-y-auto">
              <nav className="mt-4 sm:mt-5 flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`group flex items-center px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={`mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

        <main className="flex-1 md:ml-56 lg:ml-64" aria-live="polite">
          <div className="py-4 sm:py-6 pb-20 sm:pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              {/* Breadcrumbs */}
              {crumbs.length > 1 && (
                <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                    {crumbs.map((crumb, index) => (
                      <li key={crumb.to}>
                        <div className="flex items-center">
                          {index > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mx-1 sm:mx-2" />}
                          <Link
                            to={crumb.to}
                            className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                              index === crumbs.length - 1
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {crumb.label}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* Page Content */}
              <AnimatePresence mode="wait">
                <MotionDiv key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  <Outlet />
                </MotionDiv>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Notification Drawer */}
        <NotificationDrawer
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
        />
      </div>

      
    </div>
  )
}






