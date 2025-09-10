import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'

export function TeacherSubjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher', 'subjects'],
    queryFn: async () => (await api.get('/subjects?scope=mine')).data,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading subjects...</p>
      </div>
    </div>
  )

  const subjects = data?.data || []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Subjects</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            View and manage your assigned subjects
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Subjects Assigned</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You haven't been assigned to any subjects yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {subjects.map((s) => (
            <div key={s._id} className="group rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {s.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {s.classId?.name || s.classId?._id || 'No class assigned'}
                  </p>
                </div>
                <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                  📚
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Active
                </div>
                {s.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {s.description}
                  </p>
                )}
                {s.code && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Code: {s.code}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button className="w-full text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




























