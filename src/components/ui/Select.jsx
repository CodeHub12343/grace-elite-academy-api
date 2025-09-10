import React from 'react'

export function Select({ 
  label, 
  error, 
  register, 
  name, 
  options = [], 
  className = '', 
  onChange, 
  value, 
  disabled = false,
  ...rest 
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>}
      <select 
        className={`mt-1 w-full px-3 py-2 rounded border ${
          error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
        } bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        {...(register && name ? register(name) : {})}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}










