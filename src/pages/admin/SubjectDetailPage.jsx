import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ProfileCard } from '../../components/ui/ProfileCard'
import { subjectsApi, classesApi, teachersApi } from '../../lib/api'

export function SubjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch subject details
  const { data: subjectData, isLoading: subjectLoading } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => subjectsApi.getSubjectById(id),
    enabled: !!id,
  })

  // Fetch related data
  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesApi.getClasses({ limit: 1000 }),
  })

  const { data: teachersData } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: () => teachersApi.getTeachers({ limit: 1000 }),
  })

  // Mutations for updating relationships
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }) => subjectsApi.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject', id] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
  })

  if (subjectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading subject details...</div>
      </div>
    )
  }

  if (!subjectData?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Subject not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The subject you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/a/subjects')}>
          Back to Subjects
        </Button>
      </div>
    )
  }

  const subject = subjectData.data

  const handleRemoveTeacher = async (teacherId) => {
    const updatedTeacherIds = subject.teacherIds
      .filter(t => t._id !== teacherId)
      .map(t => t._id)
    
    await updateSubjectMutation.mutateAsync({
      id: subject._id,
      data: { teacherIds: updatedTeacherIds }
    })
  }

  const handleChangeClass = async (newClassId) => {
    await updateSubjectMutation.mutateAsync({
      id: subject._id,
      data: { classId: newClassId }
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => navigate('/a/subjects')}
            className="mb-4"
          >
            ← Back to Subjects
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {subject.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Subject details and management
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/subjects/${subject._id}/edit`)} className="w-full sm:w-auto">
          Edit Subject
        </Button>
      </div>

      {/* Subject Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Subject Code</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                {subject.code}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Teachers</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {subject.teacherIds?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Class</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                {subject.classId?.name || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Assignment Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Class Assignment</h2>
        </div>
        <div className="p-4 sm:p-6">
          {subject.classId ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600">
                    {subject.classId.name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {subject.classId.name} - Section {subject.classId.section}
                  </p>
                  <p className="text-sm text-gray-500">Class</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newClassId = prompt('Enter new class ID:')
                    if (newClassId) handleChangeClass(newClassId)
                  }}
                  className="w-full sm:w-auto"
                >
                  Change Class
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChangeClass('')}
                  className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No class assigned to this subject</p>
              <Button
                onClick={() => {
                  const newClassId = prompt('Enter class ID:')
                  if (newClassId) handleChangeClass(newClassId)
                }}
                className="w-full sm:w-auto"
              >
                Assign to Class
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Teachers Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Assigned Teachers</h2>
        </div>
        <div className="p-4 sm:p-6">
          {subject.teacherIds?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.teacherIds.map(teacher => (
                <div key={teacher._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {teacher.name?.charAt(0).toUpperCase() || 'T'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{teacher.name}</p>
                      {teacher.qualification && (
                        <p className="text-sm text-gray-500 truncate">{teacher.qualification}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveTeacher(teacher._id)}
                    className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No teachers assigned to this subject</p>
          )}
        </div>
      </div>

      {/* Subject Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Subject Information</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Name
              </label>
              <p className="text-gray-900 dark:text-white">{subject.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Code
              </label>
              <p className="text-gray-900 dark:text-white">{subject.code}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <p className="text-gray-900 dark:text-white">
              {subject.description || 'No description available'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created At
              </label>
              <p className="text-gray-900 dark:text-white">
                {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900 dark:text-white">
                {subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

