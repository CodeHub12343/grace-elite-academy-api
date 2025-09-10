import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import { termResultsApi, studentsApi, classesApi, subjectsApi } from '../../lib/api'

// Form validation schemas
const singleUploadSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  term: z.enum(['term1', 'term2', 'final'], { required_error: 'Term is required' }),
  academicYear: z.string().min(1, 'Academic year is required'),
  comments: z.string().optional()
})

const bulkUploadSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  term: z.enum(['term1', 'term2', 'final'], { required_error: 'Term is required' }),
  academicYear: z.string().min(1, 'Academic year is required'),
  comments: z.string().optional()
})

const subjectResultSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  marks: z.coerce.number().min(0, 'Marks must be 0 or greater'),
  maxMarks: z.coerce.number().min(1, 'Max marks must be greater than 0'),
  examType: z.enum(['midterm', 'final', 'assignment']).default('final')
})

export function TermResultsPage() {
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkResults, setBulkResults] = useState([])
  const queryClient = useQueryClient()

  // Fetch data
  const { data: studentsData } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => studentsApi.getStudents({ limit: 100 })
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => classesApi.getClasses({ limit: 100 })
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: () => subjectsApi.getSubjects({ limit: 100 })
  })

  // Fetch term results for viewing
  const { data: termResultsData, refetch: refetchResults } = useQuery({
    queryKey: ['term-results', selectedClass, selectedTerm, selectedYear],
    queryFn: () => {
      if (selectedClass && selectedTerm && selectedYear) {
        return termResultsApi.getClassResults(selectedClass, { term: selectedTerm, academicYear: selectedYear })
      }
      return null
    },
    enabled: !!(selectedClass && selectedTerm && selectedYear)
  })

  // Single upload form
  const singleForm = useForm({
    resolver: zodResolver(singleUploadSchema),
    defaultValues: {
      studentId: '',
      classId: '',
      term: '',
      academicYear: '',
      comments: ''
    }
  })

  // Bulk upload form
  const bulkForm = useForm({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: {
      classId: '',
      term: '',
      academicYear: '',
      comments: ''
    }
  })

  // Mutations
  const singleUploadMutation = useMutation({
    mutationFn: termResultsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-results'] })
      singleForm.reset()
      alert('Term result uploaded successfully!')
    },
    onError: (error) => {
      alert(`Upload failed: ${error.message}`)
    }
  })

  const bulkUploadMutation = useMutation({
    mutationFn: termResultsApi.bulkUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-results'] })
      bulkForm.reset()
      setBulkResults([])
      setShowBulkForm(false)
      alert('Bulk upload completed successfully!')
    },
    onError: (error) => {
      alert(`Bulk upload failed: ${error.message}`)
    }
  })

  const publishMutation = useMutation({
    mutationFn: termResultsApi.publish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-results'] })
      alert('Result published successfully!')
    },
    onError: (error) => {
      alert(`Publication failed: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: termResultsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['term-results'] })
      alert('Result deleted successfully!')
    },
    onError: (error) => {
      alert(`Deletion failed: ${error.message}`)
    }
  })

  // Generate academic years (current year + 2 previous)
  const currentYear = new Date().getFullYear()
  const academicYears = Array.from({ length: 3 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`)

  // Handle single upload
  const handleSingleUpload = (data) => {
    const subjects = subjectsData?.data?.map(subject => ({
      subjectId: subject._id,
      marks: Math.floor(Math.random() * 40) + 60, // Random marks 60-100
      maxMarks: 100,
      examType: 'final'
    }))

    singleUploadMutation.mutate({
      ...data,
      subjects
    })
  }

  // Handle bulk upload
  const handleBulkUpload = (data) => {
    if (bulkResults.length === 0) {
      alert('Please add student results first')
      return
    }

    const payload = {
      ...data,
      results: bulkResults.map(result => ({
        studentId: result.studentId,
        subjects: result.subjects
      }))
    }

    bulkUploadMutation.mutate(payload)
  }

  // Add student to bulk results
  const addStudentToBulk = (studentId) => {
    if (!subjectsData?.data) return

    const subjects = subjectsData.data.map(subject => ({
      subjectId: subject._id,
      marks: Math.floor(Math.random() * 40) + 60,
      maxMarks: 100,
      examType: 'final'
    }))

    setBulkResults(prev => [...prev, { studentId, subjects }])
  }

  // Remove student from bulk results
  const removeStudentFromBulk = (studentId) => {
    setBulkResults(prev => prev.filter(r => r.studentId !== studentId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Term Results Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {['upload', 'view', 'bulk'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab === 'upload' && 'Single Upload'}
            {tab === 'view' && 'View Results'}
            {tab === 'bulk' && 'Bulk Upload'}
          </button>
        ))}
      </div>

      {/* Single Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Single Term Result</h2>
          <form onSubmit={singleForm.handleSubmit(handleSingleUpload)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student
                </label>
                <select
                  {...singleForm.register('studentId')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">Select Student</option>
                  {studentsData?.data?.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.userId?.name || student.rollNumber} - {student.classId?.name}
                    </option>
                  ))}
                </select>
                {singleForm.formState.errors.studentId && (
                  <p className="text-red-500 text-sm mt-1">{singleForm.formState.errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  {...singleForm.register('classId')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">Select Class</option>
                  {classesData?.data?.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
                {singleForm.formState.errors.classId && (
                  <p className="text-red-500 text-sm mt-1">{singleForm.formState.errors.classId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term
                </label>
                <select
                  {...singleForm.register('term')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">Select Term</option>
                  <option value="term1">Term 1</option>
                  <option value="term2">Term 2</option>
                  <option value="final">Final</option>
                </select>
                {singleForm.formState.errors.term && (
                  <p className="text-red-500 text-sm mt-1">{singleForm.formState.errors.term.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year
                </label>
                <select
                  {...singleForm.register('academicYear')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">Select Year</option>
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {singleForm.formState.errors.academicYear && (
                  <p className="text-red-500 text-sm mt-1">{singleForm.formState.errors.academicYear.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comments
              </label>
              <textarea
                {...singleForm.register('comments')}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                placeholder="Additional comments..."
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Subject marks will be automatically generated with random values between 60-100 for demonstration purposes.
              </p>
            </div>

            <Button
              type="submit"
              disabled={singleUploadMutation.isPending}
              className="w-full md:w-auto"
            >
              {singleUploadMutation.isPending ? 'Uploading...' : 'Upload Result'}
            </Button>
          </form>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Bulk Upload Term Results</h2>
          
          {!showBulkForm ? (
            <div className="text-center py-8">
              <Button onClick={() => setShowBulkForm(true)}>
                Start Bulk Upload
              </Button>
            </div>
          ) : (
            <form onSubmit={bulkForm.handleSubmit(handleBulkUpload)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class
                  </label>
                  <select
                    {...bulkForm.register('classId')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  >
                    <option value="">Select Class</option>
                    {classesData?.data?.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Term
                  </label>
                  <select
                    {...bulkForm.register('term')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  >
                    <option value="">Select Term</option>
                    <option value="term1">Term 1</option>
                    <option value="term2">Term 2</option>
                    <option value="final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    {...bulkForm.register('academicYear')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comments
                </label>
                <textarea
                  {...bulkForm.register('comments')}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Additional comments..."
                />
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Students
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
                  {studentsData?.data
                    ?.filter(student => !bulkForm.watch('classId') || student.classId?._id === bulkForm.watch('classId'))
                    ?.map(student => (
                      <label key={student._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={bulkResults.some(r => r.studentId === student._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addStudentToBulk(student._id)
                            } else {
                              removeStudentFromBulk(student._id)
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {student.userId?.name || student.rollNumber}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Selected Students Preview */}
              {bulkResults.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <p className="text-sm font-medium mb-2">Selected Students ({bulkResults.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {bulkResults.map(result => {
                      const student = studentsData?.data?.find(s => s._id === result.studentId)
                      return (
                        <span
                          key={result.studentId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {student?.userId?.name || student?.rollNumber}
                          <button
                            type="button"
                            onClick={() => removeStudentFromBulk(result.studentId)}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={bulkUploadMutation.isPending || bulkResults.length === 0}
                  className="flex-1"
                >
                  {bulkUploadMutation.isPending ? 'Uploading...' : `Upload ${bulkResults.length} Results`}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowBulkForm(false)
                    setBulkResults([])
                    bulkForm.reset()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* View Results Tab */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-3">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">All Classes</option>
                  {classesData?.data?.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">All Terms</option>
                  <option value="term1">Term 1</option>
                  <option value="term2">Term 2</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  <option value="">All Years</option>
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {termResultsData?.data && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">
                  Term Results ({termResultsData.count})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Average
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {termResultsData.data.map((result) => (
                      <tr key={result._id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.studentId?.userId?.name || result.studentId?.rollNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.classId?.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {result.term?.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.academicYear}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.averagePercentage}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.totalMarks}/{result.totalMaxMarks}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.overallGrade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            result.overallGrade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            result.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            result.overallGrade === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {result.overallGrade}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.isPublished
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {result.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!result.isPublished && (
                              <Button
                                size="sm"
                                onClick={() => publishMutation.mutate(result._id)}
                                disabled={publishMutation.isPending}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this result?')) {
                                  deleteMutation.mutate(result._id)
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!termResultsData?.data && selectedClass && selectedTerm && selectedYear && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No results found for the selected criteria
            </div>
          )}

          {(!selectedClass || !selectedTerm || !selectedYear) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Please select class, term, and academic year to view results
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TermResultsPage





















