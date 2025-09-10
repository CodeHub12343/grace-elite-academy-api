import { Button } from './Button'

export function ProfileCard({
  user,
  onEdit,
  onDelete,
  onView,
  onMessage,
  actions = [],
  className = ""
}) {
  const defaultActions = []
  
  if (onView) {
    defaultActions.push({
      label: 'View',
      onClick: onView,
      variant: 'outline',
      size: 'sm'
    })
  }
  
  if (onEdit) {
    defaultActions.push({
      label: 'Edit',
      onClick: onEdit,
      variant: 'outline',
      size: 'sm'
    })
  }
  
  if (onMessage) {
    defaultActions.push({
      label: 'Message',
      onClick: onMessage,
      variant: 'outline',
      size: 'sm'
    })
  }
  
  if (onDelete) {
    defaultActions.push({
      label: 'Delete',
      onClick: onDelete,
      variant: 'outline',
      size: 'sm',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    })
  }

  const allActions = [...defaultActions, ...actions]

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </p>
            {user.email && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {user.email}
              </p>
            )}
          </div>
        </div>
        
        {user.status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : user.status === 'inactive'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {user.status}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        {user.phone && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {user.phone}
          </div>
        )}
        
        {user.qualification && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            {user.qualification}
          </div>
        )}
        
        {user.experience && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
            {user.experience} years experience
          </div>
        )}
        
        {user.rollNumber && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Roll: {user.rollNumber}
          </div>
        )}
        
        {user.parentName && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Parent: {user.parentName}
          </div>
        )}
      </div>

      {/* Actions */}
      {allActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size={action.size || 'sm'}
              onClick={action.onClick}
              className={action.className}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

























