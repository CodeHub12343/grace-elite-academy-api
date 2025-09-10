import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ProfileCard } from '../../components/ui/ProfileCard'
import { classesApi, teachersApi, subjectsApi, studentsApi } from '../../lib/api'

export function ClassDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesApi.getClassById(id),
    enabled: !!id,
  })

  // Fetch related data
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: () => teachersApi.getTeachers({ limit: 1000 }),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: () => subjectsApi.getSubjects({ limit: 1000 }),
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => studentsApi.getStudents({ limit: 1000 }),
  })

  // Mutations for updating relationships
  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classesApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', id] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })

  if (classLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading class details...</div>
      </div>
    )
  }

  if (!classData?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Class not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The class you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/a/classes')}>
          Back to Classes
        </Button>
      </div>
    )
  }

  const cls = classData.data

  const handleRemoveTeacher = async (teacherId) => {
    const updatedTeacherIds = cls.teacherIds
      .filter(t => t._id !== teacherId)
      .map(t => t._id)
    
    await updateClassMutation.mutateAsync({
      id: cls._id,
      data: { teacherIds: updatedTeacherIds }
    })
  }

  const handleRemoveSubject = async (subjectId) => {
    const updatedSubjectIds = cls.subjectIds
      .filter(s => s._id !== subjectId)
      .map(s => s._id)
    
    await updateClassMutation.mutateAsync({
      id: cls._id,
      data: { subjectIds: updatedSubjectIds }
    })
  }

  const handleRemoveStudent = async (studentId) => {
    const updatedStudentIds = cls.studentIds
      .filter(s => s._id !== studentId)
      .map(s => s._id)
    
    await updateClassMutation.mutateAsync({
      id: cls._id,
      data: { studentIds: updatedStudentIds }
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => navigate('/a/classes')}
            className="mb-4"
          >
            ← Back to Classes
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {cls.name} - Section {cls.section}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Class details and management
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/classes/${cls._id}/edit`)} className="w-full sm:w-auto">
          Edit Class
        </Button>
      </div>

      {/* Class Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Teachers</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {cls.teacherIds?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Subjects</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {cls.subjectIds?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Students</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {cls.studentIds?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Assigned Teachers</h2>
        </div>
        <div className="p-4 sm:p-6">
          {cls.teacherIds?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cls.teacherIds.map(teacher => (
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
            <p className="text-gray-500 text-center py-8">No teachers assigned to this class</p>
          )}
        </div>
      </div>

      {/* Subjects Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Assigned Subjects</h2>
        </div>
        <div className="p-4 sm:p-6">
          {cls.subjectIds?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cls.subjectIds.map(subject => (
                <div key={subject._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-green-600">
                        {subject.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{subject.name}</p>
                      <p className="text-sm text-gray-500">Code: {subject.code}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveSubject(subject._id)}
                    className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No subjects assigned to this class</p>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Enrolled Students</h2>
        </div>
        <div className="p-4 sm:p-6">
          {cls.studentIds?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cls.studentIds.map(student => (
                <div key={student._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-purple-600">
                        {student.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{student.name}</p>
                      {student.rollNumber && (
                        <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveStudent(student._id)}
                    className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No students enrolled in this class</p>
          )}
        </div>
      </div>
    </div>
  )
}

