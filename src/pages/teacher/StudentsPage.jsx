import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'

export function TeacherStudentsPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const { data: studentsPage } = useQuery({
    queryKey: ['students','mine', page, q],
    queryFn: async () => (await api.get(`/students?scope=mine&page=${page}&limit=20&q=${encodeURIComponent(q)}`)).data,
    staleTime: 0,
  })

  const students = studentsPage?.data ?? []
  const total = studentsPage?.pagination?.total ?? 0
  const totalPages = studentsPage?.pagination?.pages ?? 1

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            View and manage your students
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {total} student{total !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <input 
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Search students by name..." 
            value={q} 
            onChange={(e) => { setPage(1); setQ(e.target.value) }} 
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Students Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {q ? 'Try adjusting your search criteria.' : 'You don\'t have any students assigned yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {students.map((s) => (
              <div key={s._id || s.id} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {(s.userId?.name || s.name || s._id)?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {s.userId?.name || s.name || s._id}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {s.classId?.name || s.className || 'No class assigned'}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    (s.status || 'active') === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {s.status || 'active'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id || s.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                            {(s.userId?.name || s.name || s._id)?.charAt(0)?.toUpperCase() || 'S'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {s.userId?.name || s.name || s._id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {s.classId?.name || s.className || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (s.status || 'active') === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {s.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Page {page} of {totalPages} • {total} total students
          </div>
          <div className="flex items-center justify-center space-x-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)} 
              className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)} 
              className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}




























