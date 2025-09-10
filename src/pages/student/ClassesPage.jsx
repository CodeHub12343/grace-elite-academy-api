import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'

export function StudentClassesPage() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['student', 'classes'],
    queryFn: async () => (await api.get('/classes?scope=enrolled')).data?.data || [],
  })
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading classes...</p>
        </div>
      </div>
    )
  }
  
  if (!classes || classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <div className="text-4xl sm:text-6xl mb-4">📚</div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">No Classes Found</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            You haven't been enrolled in any classes yet. Contact your administrator for enrollment.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Classes</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View all your enrolled classes</p>
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {classes.length} {classes.length === 1 ? 'class' : 'classes'} enrolled
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {classes.map((c) => (
          <div key={c._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {c.name}{c.section ? ` ${c.section}` : ''}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {Array.isArray(c.subjectIds) ? c.subjectIds.length : (c.subjects || 0)} subjects
                </p>
              </div>
            </div>
            
            {c.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {c.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span>Class ID: {c._id?.slice(-6) || 'N/A'}</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full">
                Enrolled
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentClassesPage






















