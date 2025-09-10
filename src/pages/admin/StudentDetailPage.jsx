import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ProfileCard } from '../../components/ui/ProfileCard'
import { studentsApi, classesApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Home, 
  Users, 
  BookOpen,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react'

export function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, role } = useAuth()

  // Fetch student details
  const { data: studentData, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getStudentById(id),
    enabled: !!id && !!user,
    retry: 1,
  })

  // Fetch related data
  const { data: _classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesApi.getClasses({ limit: 1000 }),
    enabled: !!user,
    retry: 1,
  })

  // Mutations for updating relationships
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error) => {
      console.error('Failed to update student:', error)
      alert('Failed to update student. Please try again.')
    },
  })

  // Check if user is authenticated and has permission
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to view student details.
        </p>
        <Button onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </div>
    )
  }

  // Check if user has permission to view student details
  if (!['admin', 'teacher', 'student'].includes(role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You don't have permission to view student details.
        </p>
        <Button onClick={() => navigate('/a/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Handle loading state
  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading student details...</div>
      </div>
    )
  }

  // Handle student fetch error
  if (studentError) {
    console.error('Student fetch error:', studentError)
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Student
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {studentError.message || 'Failed to load student details. Please try again.'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => navigate('/a/students')}>
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  // Handle case where student data is not found
  if (!studentData?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Student not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The student you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/a/students')}>
          Back to Students
        </Button>
      </div>
    )
  }

  const student = studentData.data

  const handleChangeClass = async (newClassId) => {
    try {
      await updateStudentMutation.mutateAsync({
        id: student._id,
        data: { classId: newClassId }
      })
    } catch (error) {
      console.error('Failed to change class:', error)
    }
  }

  const handleUpdateRollNumber = async (newRollNumber) => {
    try {
      await updateStudentMutation.mutateAsync({
        id: student._id,
        data: { rollNumber: newRollNumber }
      })
    } catch (error) {
      console.error('Failed to update roll number:', error)
    }
  }

  const handleUpdateParentInfo = async (field, value) => {
    try {
      await updateStudentMutation.mutateAsync({
        id: student._id,
        data: { [field]: value }
      })
    } catch (error) {
      console.error('Failed to update parent info:', error)
    }
  }


  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Not provided'
    try {
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return `${age} years old`
    } catch {
      return 'Not provided'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/students')}
            className="mb-4"
          >
            ← Back to Students
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {student.userId?.name || 'Unknown Student'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Student profile and enrollment details
          </p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => navigate(`/admin/students/${student._id}/edit`)} className="w-full sm:w-auto">
            Edit Student
          </Button>
        )}
      </div>

      {/* Identifiers & Metadata */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Identifiers & Metadata</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Student ID (_id)</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{student._id}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User ID</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{student.userId?._id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class ID</label>
              <p className="text-sm text-gray-900 dark:text-white break-all">{student.classId?._id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</label>
              <p className="text-sm text-gray-900 dark:text-white">{student.createdAt ? new Date(student.createdAt).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Updated At</label>
              <p className="text-sm text-gray-900 dark:text-white">{student.updatedAt ? new Date(student.updatedAt).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Document Version (__v)</label>
              <p className="text-sm text-gray-900 dark:text-white">{typeof student.__v === 'number' ? student.__v : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Roll Number</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {student.rollNumber || 'Not assigned'}
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
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Class</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {student.classId?.name || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Parent</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {student.parentName || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Contact</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {student.parentContact || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Student Profile</h2>
        </div>
        <div className="p-4 sm:p-6">
          <ProfileCard
            user={{
              ...student.userId,
              rollNumber: student.rollNumber,
              parentName: student.parentName,
              parentContact: student.parentContact,
            }}
            onEdit={role === 'admin' ? () => navigate(`/admin/students/${student._id}/edit`) : undefined}
            onDelete={role === 'admin' ? () => navigate(`/admin/students/${student._id}/delete`) : undefined}
            actions={[
              {
                label: 'Class: ' + (student.classId?.name || 'Unassigned'),
                onClick: () => {},
                variant: 'ghost',
                size: 'sm',
                className: 'text-blue-600',
              },
              {
                label: 'Roll: ' + (student.rollNumber || 'Not assigned'),
                onClick: () => {},
                variant: 'ghost',
                size: 'sm',
                className: 'text-green-600',
              },
            ]}
          />
        </div>
      </div>

      {/* Class Enrollment Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Class Enrollment</h2>
        </div>
        <div className="p-4 sm:p-6">
          {student.classId ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {student.classId.name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {student.classId.name} - Section {student.classId.section || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Current Class</p>
                </div>
              </div>
              {role === 'admin' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                    Unenroll
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Student is not enrolled in any class</p>
              {role === 'admin' && (
                <Button
                  onClick={() => {
                    const newClassId = prompt('Enter class ID:')
                    if (newClassId) handleChangeClass(newClassId)
                  }}
                >
                  Enroll in Class
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Academic Information</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roll Number
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-gray-900 dark:text-white">{student.rollNumber || 'Not assigned'}</p>
                {role === 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newRollNumber = prompt('Enter new roll number:')
                      if (newRollNumber) handleUpdateRollNumber(newRollNumber)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enrollment Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Status
            </label>
            <p className="text-gray-900 dark:text-white">
              {student.classId ? 'Enrolled' : 'Not Enrolled'}
            </p>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Parent/Guardian Information</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent/Guardian Name
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-gray-900 dark:text-white">{student.parentName || 'Not provided'}</p>
                {role === 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newParentName = prompt('Enter new parent/guardian name:')
                      if (newParentName) handleUpdateParentInfo('parentName', newParentName)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Information
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-gray-900 dark:text-white">{student.parentContact || 'Not provided'}</p>
                {role === 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newContact = prompt('Enter new contact information:')
                      if (newContact) handleUpdateParentInfo('parentContact', newContact)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h2>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Full Name
                </label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{student.userId?.name || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{student.userId?.email || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Sex
                </label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{student.sex || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date of Birth and Age */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Birth Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Date of Birth
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(student.dateOfBirth)}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Age
                </label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{getAge(student.dateOfBirth)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  State of Origin
                </label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{student.stateOfOrigin || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Local Government
                </label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{student.localGovernment || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                House Address
              </label>
              <div className="flex items-start space-x-2">
                <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-900 dark:text-white">{student.houseAddress || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Religion */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Other Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Religion
                </label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900 dark:text-white">{student.religion || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Academic Information
          </h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Roll Number
              </label>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{student.rollNumber || 'Not assigned'}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Class
              </label>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{student.classId?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Academic Status
              </label>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  student.classId ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {student.classId ? 'Enrolled' : 'Not Enrolled'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Enrollment Date
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(student.createdAt)}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Last Updated
              </label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(student.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Parent/Guardian Information
          </h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Parent/Guardian Name
              </label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{student.parentName || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Parent Phone Number
              </label>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{student.parentPhoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Parent Contact Email
            </label>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900 dark:text-white">{student.parentContact || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

