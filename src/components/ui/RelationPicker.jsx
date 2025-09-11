import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'

export function RelationPicker({
  label,
  selectedIds = [],
  onSelectionChange,
  options = [],
  searchPlaceholder = "Search...",
  maxSelections,
  disabled = false,
  className = ""
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedIds.includes(option.value)
  )

  const selectedItems = options.filter(option => selectedIds.includes(option.value))

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      if (maxSelections && selectedIds.length >= maxSelections) return
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleRemove = (id) => {
    onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {maxSelections && (
          <span className="text-xs text-gray-500 ml-2">
            ({selectedIds.length}/{maxSelections})
          </span>
        )}
      </label>

      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map(item => (
            <div
              key={item.value}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span>{item.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.value)}
                disabled={disabled}
                className="text-primary hover:text-primary/80 disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span>
            {selectedItems.length === 0
              ? `Select ${label.toLowerCase()}`
              : `${selectedItems.length} selected`}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none"
                  >
                    {option.label}
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {maxSelections && (
        <p className="text-xs text-gray-500">
          Maximum {maxSelections} {label.toLowerCase()} can be selected
        </p>
      )}
    </div>
  )
}























































