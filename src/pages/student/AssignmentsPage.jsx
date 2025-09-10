import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FileUpload } from '../../components/ui/FileUpload'
import { Modal } from '../../components/ui/Modal'
import {
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Star,
  X,
  Upload,
  BarChart3,
  CheckSquare,
  Square
} from 'lucide-react'

export function StudentAssignmentsPage() {
  const qc = useQueryClient()
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Queries
  const { data: assignments } = useQuery({
    queryKey: ['assignments', 'student'],
    queryFn: () => assignmentsApi.list({ sort: '-createdAt' })
  })

  const { data: mySubmissions } = useQuery({
    queryKey: ['submissions', 'my'],
    queryFn: () => assignmentsApi.mySubmissions()
  })

  // Mutations
  const submitMutation = useMutation({
    mutationFn: (payload) => assignmentsApi.submit(payload),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['submissions', 'my'] })
      setShowSubmissionModal(false)
      setSelectedAssignment(null)
      try { window?.toast?.success?.('Assignment submitted successfully!') } catch (_) {}
    },
    onError: (error) => {
      try { window?.toast?.error?.('Failed to submit assignment. Please try again.') } catch (_) {}
      console.error('Submission failed:', error)
    }
  })

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

  const getSubmissionStatus = (assignmentId) => {
    const submission = mySubmissions?.data?.find(s => s.assignmentId === assignmentId)
    if (!submission) return { status: 'not-submitted', color: 'text-gray-600', icon: Square, text: 'Not Submitted' }
    if (submission.marks !== undefined && submission.marks !== null) {
      return { status: 'graded', color: 'text-green-600', icon: CheckSquare, text: 'Graded' }
    }
    return { status: 'submitted', color: 'text-blue-600', icon: Clock, text: 'Submitted' }
  }

  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmissionModal(true)
  }

  const openGradeModal = (assignment) => {
    const submission = mySubmissions?.data?.find(s => s.assignmentId === assignment._id)
    if (submission) {
      setSelectedSubmission(submission)
      setShowGradeModal(true)
    }
  }

  const handleSubmit = async (fileKey) => {
    if (!selectedAssignment || !fileKey) return
    
    await submitMutation.mutateAsync({
      assignmentId: selectedAssignment._id,
      fileKey,
      submittedAt: new Date().toISOString()
    })
  }

  // Analytics calculations
  const getAssignmentAnalytics = () => {
    if (!assignments?.data || !mySubmissions?.data) return null

    const totalAssignments = assignments.data.length
    const submittedAssignments = mySubmissions.data.length
    const gradedAssignments = mySubmissions.data.filter(s => s.marks !== undefined).length
    const averageScore = gradedAssignments > 0 
      ? mySubmissions.data.filter(s => s.marks !== undefined).reduce((sum, s) => sum + s.marks, 0) / gradedAssignments
      : 0

    return {
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      pendingGrading: submittedAssignments - gradedAssignments,
      averageScore: Math.round(averageScore * 100) / 100
    }
  }

  const analytics = getAssignmentAnalytics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400">View assignments, submit your work, and check your grades</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>My Progress</span>
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">My Assignment Progress</h3>
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
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.submittedAssignments}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Submitted</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.pendingGrading}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending Grade</div>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mySubmissions?.data?.length || 0}
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
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Submission</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(assignments?.data || []).map(assignment => {
                const status = getAssignmentStatus(assignment)
                const StatusIcon = status.icon
                const submissionStatus = getSubmissionStatus(assignment._id)
                const SubmissionIcon = submissionStatus.icon

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
                      {assignment.subjectId?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {assignment.classId?.name || '-'}
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
                      <div className={`flex items-center space-x-2 ${submissionStatus.color}`}>
                        <SubmissionIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {submissionStatus.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAssignment(assignment)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </Button>
                        
                        {submissionStatus.status === 'not-submitted' && (
                          <Button
                            size="sm"
                            onClick={() => openSubmissionModal(assignment)}
                            className="flex items-center space-x-1"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Submit</span>
                          </Button>
                        )}
                        
                        {submissionStatus.status === 'graded' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGradeModal(assignment)}
                            className="flex items-center space-x-1"
                          >
                            <Star className="h-4 w-4" />
                            <span>View Grade</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={selectedAssignment.title}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Assignment Details</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Subject:</strong> {selectedAssignment.subjectId?.name || 'N/A'}</p>
                  <p><strong>Class:</strong> {selectedAssignment.classId?.name || 'N/A'}</p>
                  <p><strong>Due Date:</strong> {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Max Score:</strong> {selectedAssignment.maxScore || 100} points</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Status</h4>
                <div className="space-y-2">
                  {(() => {
                    const status = getSubmissionStatus(selectedAssignment._id)
                    const StatusIcon = status.icon
                    return (
                      <div className={`flex items-center space-x-2 ${status.color}`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="font-medium">{status.text}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {selectedAssignment.description && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedAssignment.description}</p>
              </div>
            )}

            {selectedAssignment.instructions && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedAssignment.instructions}</p>
              </div>
            )}

            {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedAssignment.attachments.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{file.fileName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/files/${file.fileKey}`, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
                Close
              </Button>
              
              {getSubmissionStatus(selectedAssignment._id).status === 'not-submitted' && (
                <Button
                  onClick={() => {
                    setSelectedAssignment(null)
                    openSubmissionModal(selectedAssignment)
                  }}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Submit Assignment</span>
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        title={`Submit Assignment - ${selectedAssignment?.title}`}
        size="md"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Assignment Details</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p><strong>Due Date:</strong> {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Max Score:</strong> {selectedAssignment.maxScore || 100} points</p>
                {selectedAssignment.description && (
                  <p><strong>Description:</strong> {selectedAssignment.description}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Your Work *
              </label>
              <FileUpload
                category="assignments"
                relatedId={selectedAssignment._id}
                onUploadComplete={(fileKey, fileName) => handleSubmit(fileKey)}
                onUploadError={(error, fileName) => {
                  console.error(`Upload failed for ${fileName}:`, error)
                  try { window?.toast?.error?.('Upload failed. Please try again.') } catch (_) {}
                }}
                maxFiles={1}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Supported formats: PDF, DOC, DOCX, TXT, ZIP, RAR
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Make sure your file is complete and correct before submitting. 
                You cannot edit your submission after it's submitted.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowSubmissionModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Grade View Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="Assignment Grade"
        size="md"
      >
        {selectedSubmission && selectedAssignment && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Grade Details</h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p><strong>Assignment:</strong> {selectedAssignment.title}</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                <p><strong>Score:</strong> {selectedSubmission.marks}/{selectedAssignment.maxScore} points</p>
                <p><strong>Percentage:</strong> {Math.round((selectedSubmission.marks / selectedAssignment.maxScore) * 100)}%</p>
              </div>
            </div>

            {selectedSubmission.feedback && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Teacher Feedback</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{selectedSubmission.feedback}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowGradeModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}






