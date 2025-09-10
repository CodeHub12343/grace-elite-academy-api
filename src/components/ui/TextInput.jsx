import React from 'react'

export function TextInput({ 
  label, 
  error, 
  register, 
  name, 
  type = 'text', 
  placeholder, 
  className = '', 
  value, 
  onChange,
  disabled = false,
  ...rest 
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>}
      <input 
        type={type}
        className={`mt-1 w-full px-3 py-2 rounded border ${
          error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
        } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        {...(register && name ? register(name) : {})}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}










