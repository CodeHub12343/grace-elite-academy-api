import { useEffect, useState } from 'react'

const presets = [
  { name: 'Default', primary: '#3B82F6', secondary: '#10B981' },
  { name: 'Royal', primary: '#6366F1', secondary: '#06B6D4' },
  { name: 'Sunset', primary: '#F97316', secondary: '#EF4444' },
]

export function SettingsPage() {
  const [theme, setTheme] = useState(() => {
    const raw = localStorage.getItem('theme-preset')
    return raw ? JSON.parse(raw) : presets[0]
  })

  useEffect(() => {
    localStorage.setItem('theme-preset', JSON.stringify(theme))
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
  }, [theme])

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="text-xs sm:text-sm text-gray-500">Choose a theme preset.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {presets.map((p) => (
          <button 
            key={p.name} 
            onClick={() => setTheme(p)} 
            className={`rounded-xl border p-3 sm:p-4 text-left transition-colors ${theme.name === p.name ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
          >
            <div className="font-medium text-sm sm:text-base">{p.name}</div>
            <div className="flex gap-2 mt-2">
              <span className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: p.primary }} />
              <span className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: p.secondary }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage
