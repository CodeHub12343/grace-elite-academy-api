import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ProfileCard } from '../../components/ui/ProfileCard'
import { teachersApi, classesApi, subjectsApi } from '../../lib/api'

export function TeacherDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch teacher details
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => teachersApi.getTeacherById(id),
    enabled: !!id,
  })

  // Fetch related data
  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesApi.getClasses({ limit: 1000 }),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: () => subjectsApi.getSubjects({ limit: 1000 }),
  })

  // Mutations for updating relationships
  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }) => teachersApi.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', id] })
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
    },
  })

  if (teacherLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading teacher details...</div>
      </div>
    )
  }

  if (!teacherData?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Teacher not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The teacher you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/a/teachers')}>
          Back to Teachers
        </Button>
      </div>
    )
  }

  const teacher = teacherData.data

  const handleRemoveSubject = async (subjectId) => {
    const updatedSubjectIds = teacher.subjects
      .filter(s => s._id !== subjectId)
      .map(s => s._id)
    
    await updateTeacherMutation.mutateAsync({
      id: teacher._id,
      data: { subjects: updatedSubjectIds }
    })
  }

  const handleRemoveClass = async (classId) => {
    const updatedClassIds = teacher.classes
      .filter(c => c._id !== classId)
      .map(c => c._id)
    
    await updateTeacherMutation.mutateAsync({
      id: teacher._id,
      data: { classes: updatedClassIds }
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => navigate('/a/teachers')}
            className="mb-4"
          >
            ← Back to Teachers
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {teacher.userId?.name || 'Unknown Teacher'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Teacher profile and assignments
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/teachers/${teacher._id}/edit`)} className="w-full sm:w-auto">
          Edit Teacher
        </Button>
      </div>

      {/* Identifiers & Metadata */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Identifiers & Metadata</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teacher ID (_id)</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{teacher._id}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User ID</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{teacher.userId?._id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subjects (count)</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.subjects?.length || 0}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Classes (count)</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.classes?.length || 0}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.createdAt ? new Date(teacher.createdAt).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Updated At</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Document Version (__v)</label>
              <p className="text-sm text-gray-900 dark:text-white">{typeof teacher.__v === 'number' ? teacher.__v : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Qualification</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {teacher.qualification}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Experience</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                {teacher.experience} years
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Subjects</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                {teacher.subjects?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Classes</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                {teacher.classes?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Teacher Profile</h2>
        </div>
        <div className="p-4 sm:p-6">
          <ProfileCard
            user={{
              ...teacher.userId,
              qualification: teacher.qualification,
              experience: teacher.experience,
              phone: teacher.phone,
            }}
            onEdit={() => navigate(`/admin/teachers/${teacher._id}/edit`)}
            onDelete={() => navigate(`/admin/teachers/${teacher._id}/delete`)}
            actions={[
              {
                label: 'View Subjects',
                onClick: () => {},
                variant: 'ghost',
                size: 'sm',
                className: 'text-green-600',
              },
              {
                label: 'View Classes',
                onClick: () => {},
                variant: 'ghost',
                size: 'sm',
                className: 'text-blue-600',
              },
            ]}
          />
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Personal Details</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sex</label>
              <p className="text-sm text-gray-900 dark:text-white capitalize">{teacher.sex || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Religion</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.religion || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">State of Origin</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.stateOfOrigin || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Local Government</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.localGovernment || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">House Address</label>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{teacher.houseAddress || teacher.address || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Bank Details</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bank Name</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.bankName || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account Number</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{teacher.accountNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Account Name</label>
              <p className="text-sm text-gray-900 dark:text-white">{teacher.accountName || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Assigned Subjects</h2>
        </div>
        <div className="p-4 sm:p-6">
          {teacher.subjects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.subjects.map(subject => (
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
            <p className="text-gray-500 text-center py-8">No subjects assigned to this teacher</p>
          )}
        </div>
      </div>

      {/* Classes Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Assigned Classes</h2>
        </div>
        <div className="p-4 sm:p-6">
          {teacher.classes?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.classes.map(cls => (
                <div key={cls._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {cls.name?.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {cls.name} - Section {cls.section}
                      </p>
                      <p className="text-sm text-gray-500">Class</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveClass(cls._id)}
                    className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No classes assigned to this teacher</p>
          )}
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Professional Information</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <p className="text-gray-900 dark:text-white">{teacher.userId?.name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{teacher.userId?.email || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900 dark:text-white">{teacher.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Qualification
              </label>
              <p className="text-gray-900 dark:text-white">{teacher.qualification}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Years of Experience
            </label>
            <p className="text-gray-900 dark:text-white">{teacher.experience} years</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created At
              </label>
              <p className="text-gray-900 dark:text-white">
                {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900 dark:text-white">
                {teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

