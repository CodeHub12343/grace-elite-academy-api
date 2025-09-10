import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { examsApi, gradesApi, cbtApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Play, 
  Award, 
  TrendingUp, 
  BarChart3,
  FileText,
  Star,
  Target,
  Clock3,
  Info,
  BookOpen,
  User,
  Hash,
  Copy,
  Check
} from 'lucide-react'

export function StudentExamsPage() {
  const [examId, setExamId] = useState('')
  const [activeTab, setActiveTab] = useState('available') // available, completed, grades
  const [selectedExam, setSelectedExam] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [copiedExamId, setCopiedExamId] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const studentId = user?._id || user?.id
  
  // Queries
  const { data: availableExams, isLoading: loadingAvailable } = useQuery({
    queryKey: ['exams','available'],
    queryFn: () => examsApi.list({ status: 'published' }),
  })

  const { data: completedExams, isLoading: loadingCompleted } = useQuery({
    queryKey: ['exams','completed'],
    queryFn: () => cbtApi.myExams(),
  })

  const { data: gradesData, isLoading: loadingGrades } = useQuery({
    queryKey: ['grades','student', studentId],
    enabled: !!studentId,
    queryFn: () => gradesApi.student(studentId),
  })

  const exams = availableExams?.data || availableExams || []
  const completed = completedExams?.data || completedExams || []
  const grades = gradesData?.data || gradesData || []

  // Performance analytics
  const getPerformanceStats = () => {
    if (!completed.length) return null

    const totalExams = completed.length
    const passedExams = completed.filter(exam => {
      const score = exam.score || exam.percentage || 0
      return score >= 50 // Assuming 50% is passing
    }).length

    const averageScore = completed.reduce((sum, exam) => {
      return sum + (exam.score || exam.percentage || 0)
    }, 0) / totalExams

    const recentPerformance = completed
      .slice(-5) // Last 5 exams
      .reduce((sum, exam) => sum + (exam.score || exam.percentage || 0), 0) / Math.min(5, totalExams)

    return {
      totalExams,
      passedExams,
      passRate: Math.round((passedExams / totalExams) * 100),
      averageScore: Math.round(averageScore),
      recentPerformance: Math.round(recentPerformance),
      improvement: recentPerformance > averageScore ? 'improving' : 'declining'
    }
  }

  const performanceStats = getPerformanceStats()

  const getExamStatus = (exam) => {
    const now = new Date()
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)

    if (now < startTime) return { status: 'upcoming', color: 'text-blue-600', icon: Clock, bgColor: 'bg-blue-50 dark:bg-blue-900/20' }
    if (now > endTime) return { status: 'expired', color: 'text-red-600', icon: XCircle, bgColor: 'bg-red-50 dark:bg-red-900/20' }
    return { status: 'active', color: 'text-green-600', icon: CheckCircle, bgColor: 'bg-green-50 dark:bg-green-900/20' }
  }

  const handleViewDetails = (exam) => {
    setSelectedExam(exam)
    setShowDetailsModal(true)
  }

  const handleCopyExamId = async (examId) => {
    try {
      await navigator.clipboard.writeText(examId)
      setCopiedExamId(examId)
      setTimeout(() => setCopiedExamId(''), 2000)
    } catch (err) {
      console.error('Failed to copy exam ID:', err)
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'B': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'C': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'D': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'F': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">My Exams</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Take exams, view results, and track your performance</p>
        </div>
      </div>

      {/* Performance Overview */}
      {performanceStats && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{performanceStats.totalExams}</div>
              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Total Exams</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">{performanceStats.passRate}%</div>
              <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Pass Rate</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">{performanceStats.averageScore}%</div>
              <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Average Score</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400">{performanceStats.recentPerformance}%</div>
              <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Recent Avg</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${performanceStats.improvement === 'improving' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {performanceStats.improvement === 'improving' ? '↗' : '↘'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Trend</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'available', label: 'Available Exams', icon: Play, count: exams.length },
          { id: 'completed', label: 'Completed Exams', icon: CheckCircle, count: completed.length },
          { id: 'grades', label: 'Grade History', icon: Award, count: grades.length }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* Available Exams Tab */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {/* Quick Start */}
          <Card className="p-4 sm:p-6">
            <div className="text-base sm:text-lg font-semibold mb-2">Quick Start CBT Exam</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">Enter an exam ID shared by your teacher to start immediately.</div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input 
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm" 
                placeholder="Enter Exam ID" 
                value={examId} 
                onChange={(e) => setExamId(e.target.value)} 
              />
              <Button 
                onClick={() => examId && navigate(`/s/exams/${examId}/attempt`)} 
                disabled={!examId}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                <span>Start Exam</span>
              </Button>
            </div>
          </Card>

          {/* Available Exams List */}
          <Card className="p-0">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Available Exams</h3>
            </div>
            
            {loadingAvailable ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">Loading available exams...</div>
            ) : exams.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">No published exams available at the moment.</div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {exams.map((exam) => {
                    const status = getExamStatus(exam)
                    const StatusIcon = status.icon
                    const startDateTime = formatDateTime(exam.startTime)
                    
                    return (
                      <div key={exam._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{exam.title}</h4>
                              <div className="mt-1 space-y-1">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.status}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                                  <span className="font-medium">ID:</span> {exam._id}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Subject: {exam.subjectId?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Teacher: {exam.teacherId?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Start: {startDateTime.date} at {startDateTime.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Duration: {formatDuration(exam.duration)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Questions: {exam.questions?.length || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Max Marks: {exam.totalMarks || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(exam)}
                              className="flex items-center space-x-2 flex-1"
                            >
                              <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Details</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/s/exams/${exam._id}/attempt`)}
                              disabled={status.status === 'expired'}
                              className="flex items-center space-x-2 flex-1"
                            >
                              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{status.status === 'expired' ? 'Expired' : 'Start'}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block divide-y divide-gray-200 dark:divide-gray-700">
                  {exams.map((exam) => {
                    const status = getExamStatus(exam)
                    const StatusIcon = status.icon
                    const startDateTime = formatDateTime(exam.startTime)
                    
                    return (
                      <div key={exam._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-2">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{exam.title}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                                  <StatusIcon className="h-3 w-3 inline mr-1" />
                                  {status.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                                <span className="font-medium">Exam ID:</span> {exam._id}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="h-4 w-4" />
                                <span>Subject: {exam.subjectId?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Teacher: {exam.teacherId?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Start: {startDateTime.date} at {startDateTime.time}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Duration: {formatDuration(exam.duration)}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4" />
                                <span>Questions: {exam.questions?.length || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Hash className="h-4 w-4" />
                                <span>Max Marks: {exam.totalMarks || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Type: {exam.examType || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(exam)}
                              className="flex items-center space-x-2"
                            >
                              <Info className="h-4 w-4" />
                              <span>Details</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/s/exams/${exam._id}/attempt`)}
                              disabled={status.status === 'expired'}
                              className="flex items-center space-x-2"
                            >
                              <Play className="h-4 w-4" />
                              <span>{status.status === 'expired' ? 'Expired' : 'Start'}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Completed Exams Tab */}
      {activeTab === 'completed' && (
        <Card className="p-0">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Completed Exams</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View your exam results and performance</p>
          </div>
          
          {loadingCompleted ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">Loading completed exams...</div>
          ) : completed.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">No completed exams yet. Take your first exam to see results here!</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {completed.map((exam) => {
                  const score = exam.score || exam.percentage || 0
                  const grade = exam.grade || 'N/A'
                  
                  return (
                    <div key={exam._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{exam.title || exam.examName || 'Exam'}</h4>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full mt-1 ${getGradeColor(grade)}`}>
                              Grade: {grade}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Score: {score}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Completed: {new Date(exam.submittedAt || exam.completedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Time: {exam.timeTaken || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Questions: {exam.totalQuestions || exam.questions?.length || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/s/exams/${exam._id || exam.examId}/results`)}
                            className="flex items-center space-x-2 w-full sm:w-auto"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>View Results</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block divide-y divide-gray-200 dark:divide-gray-700">
                {completed.map((exam) => {
                  const score = exam.score || exam.percentage || 0
                  const grade = exam.grade || 'N/A'
                  
                  return (
                    <div key={exam._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{exam.title || exam.examName || 'Exam'}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(grade)}`}>
                              Grade: {grade}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Score: {score}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Completed: {new Date(exam.submittedAt || exam.completedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock3 className="h-4 w-4" />
                              <span>Time: {exam.timeTaken || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4" />
                              <span>Questions: {exam.totalQuestions || exam.questions?.length || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/s/exams/${exam._id || exam.examId}/results`)}
                            className="flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Results</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Grade History Tab */}
      {activeTab === 'grades' && (
        <Card className="p-0">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Grade History</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Track your academic performance across all subjects</p>
          </div>
          
          {loadingGrades ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">Loading grade history...</div>
          ) : grades.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">No grades recorded yet. Your teachers will add grades as they become available.</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {grades.map((grade) => (
                  <div key={grade._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                            {grade.subjectId?.name || grade.subject || 'Subject'}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full mt-1 ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Score: {grade.score || grade.percentage || 'N/A'}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Term: {grade.term || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Type: {grade.type || 'Assignment'}</span>
                        </div>
                      </div>
                      
                      {grade.feedback && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Feedback:</span> {grade.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block divide-y divide-gray-200 dark:divide-gray-700">
                {grades.map((grade) => (
                  <div key={grade._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {grade.subjectId?.name || grade.subject || 'Subject'}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>Score: {grade.score || grade.percentage || 'N/A'}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Term: {grade.term || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Type: {grade.type || 'Assignment'}</span>
                          </div>
                        </div>
                        
                        {grade.feedback && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Feedback:</span> {grade.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Exam Details Modal */}
      {showDetailsModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Exam Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Exam Information */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{selectedExam.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">Exam ID:</span>
                      <span className="font-mono text-gray-900 dark:text-white">{selectedExam._id}</span>
                      <button
                        onClick={() => handleCopyExamId(selectedExam._id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {copiedExamId === selectedExam._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">Type:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.examType || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">Subject:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.subjectId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">Teacher:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.teacherId?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Timing Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-300">Start Date:</span>
                      <span className="text-gray-900 dark:text-white">{formatDateTime(selectedExam.startTime).date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-300">Start Time:</span>
                      <span className="text-gray-900 dark:text-white">{formatDateTime(selectedExam.startTime).time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-gray-600 dark:text-gray-300">End Date:</span>
                      <span className="text-gray-900 dark:text-white">{formatDateTime(selectedExam.endTime).date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="text-gray-600 dark:text-gray-300">End Time:</span>
                      <span className="text-gray-900 dark:text-white">{formatDateTime(selectedExam.endTime).time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock3 className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                      <span className="text-gray-900 dark:text-white">{formatDuration(selectedExam.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Questions:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.questions?.length || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Exam Details */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exam Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Total Marks:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.totalMarks || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Question Count:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.questions?.length || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Term:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.term || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">Academic Year:</span>
                      <span className="text-gray-900 dark:text-white">{selectedExam.academicYear || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedExam.description && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedExam.description}</p>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Current Status</h4>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = getExamStatus(selectedExam)
                      const StatusIcon = status.icon
                      return (
                        <>
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${status.bgColor} ${status.color}`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {status.status.toUpperCase()}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    navigate(`/s/exams/${selectedExam._id}/attempt`)
                  }}
                  disabled={getExamStatus(selectedExam).status === 'expired'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {getExamStatus(selectedExam).status === 'expired' ? 'Exam Expired' : 'Start Exam'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

















