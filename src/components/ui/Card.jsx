import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children }) {
  return <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium">{children}</div>
}

export function CardContent({ children }) {
  return <div className="p-4">{children}</div>
}


