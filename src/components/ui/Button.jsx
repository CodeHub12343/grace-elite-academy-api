import { twMerge } from 'tailwind-merge'

const base = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none'
const variants = {
  solid: 'text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-95',
  outline: 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
}
const sizes = {
  sm: 'h-8 px-3',
  md: 'h-9 px-4',
  lg: 'h-10 px-5',
}

export function Button({ children, className = '', variant = 'solid', size = 'md', ...props }) {
  return (
    <button className={twMerge(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}


