
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi, classesApi, subjectsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FileUpload } from '../../components/ui/FileUpload'
import { Modal } from '../../components/ui/Modal'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Users,
  Star,
  X,
  Save,
  Upload,
  BarChart3,
  TrendingUp,
  CheckSquare,
  Square
} from 'lucide-react'

export function TeacherAssignmentsPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [isCreating, setCreating] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '',
    maxMarks: 100,
    resources: []
  })
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [grading, setGrading] = useState({})
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Queries
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getClasses()
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getSubjects()
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', 'teacher'],
    queryFn: () => assignmentsApi.list({ sort: '-createdAt' })
  })

  const { data: submissions } = useQuery({
    queryKey: ['submissions', activeAssignment?._id],
    queryFn: () => activeAssignment ? assignmentsApi.submissionsFor(activeAssignment._id) : null,
    enabled: !!activeAssignment
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: assignmentsApi.create,
    onSuccess: () => {
      setCreating(false)
      resetForm()
      qc.invalidateQueries({ queryKey: ['assignments'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => assignmentsApi.update(id, data),
    onSuccess: () => {
      setEditingAssignment(null)
      resetForm()
      qc.invalidateQueries({ queryKey: ['assignments'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: assignmentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
    }
  })

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }) => assignmentsApi.gradeSubmission(id, data),
    onSuccess: () => {
      setShowGradingModal(false)
      setSelectedSubmission(null)
      setGrading({})
      qc.invalidateQueries({ queryKey: ['submissions'] })
      try { window?.toast?.success?.('Grade saved successfully!') } catch (_) {}
    },
    onError: (error) => {
      try { window?.toast?.error?.('Failed to save grade. Please try again.') } catch (_) {}
      console.error('Grade submission failed:', error)
    }
  })

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      subjectId: '',
      classId: '',
      dueDate: '',
      maxMarks: 100,
      resources: []
    })
  }

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment)
    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      subjectId: assignment.subjectId || '',
      classId: assignment.classId || '',
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      maxMarks: assignment.maxMarks || 100,
      resources: assignment.resources || []
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      dueDate: new Date(form.dueDate).toISOString(),
      teacherId: user?._id // Add teacherId from authenticated user
    }

    if (editingAssignment) {
      await updateMutation.mutateAsync({ id: editingAssignment._id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  const handleGrade = async () => {
    if (!selectedSubmission || !grading.marks) return
    
    await gradeMutation.mutateAsync({
      id: selectedSubmission._id,
      data: {
        marks: parseInt(grading.marks),
        feedback: grading.feedback || '',
        gradedAt: new Date().toISOString()
      }
    })
  }

  const getAssignmentStatus = (assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)

    if (dueDate < now) {
      return { status: 'overdue', color: 'text-red-600', icon: AlertCircle, bgColor: 'bg-red-50 dark:bg-red-900/20' }
    } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'due-soon', color: 'text-orange-600', icon: Clock, bgColor: 'bg-orange-50 dark:bg-orange-900/20' }
    } else {
      return { status: 'active', color: 'text-green-600', icon: CheckCircle, bgColor: 'bg-green-50 dark:bg-green-900/20' }
    }
  }

  const getSubmissionStatus = (submission) => {
    if (submission.marks !== undefined && submission.marks !== null) {
      return { status: 'graded', color: 'text-green-600', icon: CheckSquare }
    }
    return { status: 'submitted', color: 'text-blue-600', icon: Square }
  }

  const openGradingModal = (submission) => {
    setSelectedSubmission(submission)
    setGrading({
      marks: submission.marks || submission.score || '',
      feedback: submission.feedback || ''
    })
    setShowGradingModal(true)
  }

  // Analytics calculations
  const getAssignmentAnalytics = () => {
    if (!assignments?.data || !submissions?.data) return null

    const totalAssignments = assignments.data.length
    const totalSubmissions = submissions.data.length
    const gradedSubmissions = submissions.data.filter(s => s.marks !== undefined || s.score !== undefined).length
    const averageScore = gradedSubmissions > 0 
      ? submissions.data.filter(s => s.marks !== undefined || s.score !== undefined)
          .reduce((sum, s) => sum + (s.marks || s.score || 0), 0) / gradedSubmissions
      : 0

    return {
      totalAssignments,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      averageScore: Math.round(averageScore * 100) / 100
    }
  }

  const analytics = getAssignmentAnalytics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage assignments for your classes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button onClick={() => setCreating(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assignment Analytics</h3>
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.totalAssignments}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Assignments</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.totalSubmissions}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Submissions</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.pendingGrading}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending Grading</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.averageScore}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Average Score</div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments?.data?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments?.data?.filter(a => getAssignmentStatus(a).status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments?.data?.filter(a => getAssignmentStatus(a).status === 'due-soon').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments?.data?.filter(a => getAssignmentStatus(a).status === 'overdue').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create/Edit Assignment Form */}
      {(isCreating || editingAssignment) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false)
                setEditingAssignment(null)
                resetForm()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  required
                  value={form.subjectId}
                  onChange={(e) => setForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects?.data?.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class *
                </label>
                <select
                  required
                  value={form.classId}
                  onChange={(e) => setForm(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Class</option>
                  {classes?.data?.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxMarks}
                  onChange={(e) => setForm(prev => ({ ...prev, maxMarks: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Assignment description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resources (S3 File Upload)
              </label>
              <FileUpload
                category="assignments"
                relatedId={editingAssignment?._id || 'new'}
                onUploadComplete={(fileKey, fileName) => {
                  setForm(prev => ({
                    ...prev,
                    resources: [...prev.resources, { fileKey, fileName }]
                  }))
                }}
                onUploadError={(error, fileName) => {
                  console.error(`Upload failed for ${fileName}:`, error)
                }}
                maxFiles={5}
              />
              
              {/* Show uploaded files */}
              {form.resources.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.resources.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{file.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          resources: prev.resources.filter((_, i) => i !== index)
                        }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreating(false)
                  setEditingAssignment(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center space-x-2"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingAssignment ? 'Update' : 'Create'} Assignment</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Assignments List */}
      <Card className="p-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Assignments</h3>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Title</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Subject</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Class</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Due Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Submissions</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(assignments?.data || []).map(assignment => {
                const status = getAssignmentStatus(assignment)
                const StatusIcon = status.icon
                const submissionCount = submissions?.data?.filter(s => s.assignmentId === assignment._id).length || 0

                return (
                  <tr key={assignment._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{assignment.title}</div>
                        {assignment.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {assignment.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {subjects?.data?.find(s => s._id === assignment.subjectId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {classes?.data?.find(c => c._id === assignment.classId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center space-x-2 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">
                          {status.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {submissionCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveAssignment(assignment)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Submissions</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(assignment)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this assignment?')) {
                              deleteMutation.mutate(assignment._id)
                            }
                          }}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Submissions View */}
      {activeAssignment && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Submissions for: {activeAssignment.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {submissions?.data?.length || 0} submissions received
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setActiveAssignment(null)}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>

          {submissions?.data?.length > 0 ? (
            <div className="space-y-4">
              {submissions.data.map(submission => {
                const submissionStatus = getSubmissionStatus(submission)
                const StatusIcon = submissionStatus.icon
                const studentName = submission.studentId?.userId?.name || 
                                  `${submission.studentId?.firstName || ''} ${submission.studentId?.lastName || ''}`.trim() || 
                                  'Unknown Student'
                const currentScore = submission.marks || submission.score || 0
                const maxScore = activeAssignment.maxMarks || 100

                return (
                  <div key={submission._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {studentName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`flex items-center space-x-2 ${submissionStatus.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">
                            {submissionStatus.status}
                          </span>
                        </div>
                        {(submission.marks !== undefined || submission.score !== undefined) && (
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {currentScore}/{maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Download submission files */}
                        {submission.files && submission.files.length > 0 ? (
                          submission.files.map((file, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/files/${file.fileKey}`, '_blank')}
                              className="flex items-center space-x-1"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download {file.fileName}</span>
                            </Button>
                          ))
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/files/${submission.fileKey}`, '_blank')}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => openGradingModal(submission)}
                          className="flex items-center space-x-1"
                        >
                          {(submission.marks !== undefined || submission.score !== undefined) ? (
                            <>
                              <Edit className="h-4 w-4" />
                              <span>Update Grade</span>
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4" />
                              <span>Grade</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Feedback:</span> {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No submissions yet for this assignment</p>
            </div>
          )}
        </Card>
      )}

      {/* Grading Modal */}
      <Modal
        isOpen={showGradingModal}
        onClose={() => setShowGradingModal(false)}
        title={`Grade Submission - ${selectedSubmission?.studentId?.userId?.name || 
               `${selectedSubmission?.studentId?.firstName || ''} ${selectedSubmission?.studentId?.lastName || ''}`.trim() || 
               'Student'}`}
        size="md"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Student:</strong> {selectedSubmission.studentId?.userId?.name || 
                   `${selectedSubmission.studentId?.firstName || ''} ${selectedSubmission.studentId?.lastName || ''}`.trim() || 
                   'Unknown Student'}</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                <p><strong>Max Score:</strong> {activeAssignment?.maxMarks || 100} points</p>
                {selectedSubmission.marks !== undefined || selectedSubmission.score !== undefined ? (
                  <p><strong>Current Score:</strong> {selectedSubmission.marks || selectedSubmission.score || 0} points</p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Marks * (out of {activeAssignment?.maxMarks || 100})
              </label>
              <input
                type="number"
                min="0"
                max={activeAssignment?.maxMarks || 100}
                required
                value={grading.marks}
                onChange={(e) => setGrading(prev => ({ ...prev, marks: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback
              </label>
              <textarea
                rows={4}
                value={grading.feedback}
                onChange={(e) => setGrading(prev => ({ ...prev, feedback: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide constructive feedback for the student..."
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This feedback will be visible to the student.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowGradingModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGrade}
                disabled={!grading.marks || gradeMutation.isPending}
                className="flex items-center space-x-2"
              >
                {gradeMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    <span>Submit Grade</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}







