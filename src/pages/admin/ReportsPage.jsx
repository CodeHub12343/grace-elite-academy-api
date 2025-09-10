import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { Card } from '../../components/ui/Card'
import { reportsApi, financeAdminApi, paymentsApi, gradesApi, cbtApi } from '../../lib/api'
import { EnrollmentChart } from '../../components/reports/EnrollmentChart'
import { AcademicPerformanceChart } from '../../components/reports/AcademicPerformanceChart'
import { TeacherWorkloadChart } from '../../components/reports/TeacherWorkloadChart'
import { ClassCapacityChart } from '../../components/reports/ClassCapacityChart'
import { SubjectDistributionChart } from '../../components/reports/SubjectDistributionChart'
import { AttendanceTrendsChart } from '../../components/reports/AttendanceTrendsChart'
import { FinancialTrendsChart } from '../../components/reports/FinancialTrendsChart'
import { StudentPerformanceTrendsChart } from '../../components/reports/StudentPerformanceTrendsChart'
import { ExamAnalyticsChart } from '../../components/reports/ExamAnalyticsChart'
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedReport, setSelectedReport] = useState('overview')
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [examId, setExamId] = useState('')

  // Finance (overview) data
  const { data: financeData, isLoading: financeLoading, error: financeError, refetch: refetchFinance } = useQuery({
    queryKey: ['reports', 'finance', selectedPeriod],
    queryFn: () => reportsApi.getFinanceReport({ period: selectedPeriod }),
  })

  // Financial data for comprehensive reporting
  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['reports', 'financial', selectedPeriod],
    queryFn: async () => {
      // Fetch comprehensive financial data
      const [categories, invoices, payments] = await Promise.all([
        financeAdminApi.listCategories(),
        financeAdminApi.listInvoices({ period: selectedPeriod }),
        paymentsApi.history('all', { period: selectedPeriod })
      ])
      return { categories, invoices, payments }
    },
    enabled: selectedReport === 'financial' || selectedReport === 'overview'
  })

  // Student performance trends
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['reports', 'performance', selectedPeriod],
    queryFn: async () => {
      // Fetch performance data across classes
      const classes = await reportsApi.getGeneralReports({ type: 'classes' })
      const performancePromises = classes?.data?.map(async (cls) => {
        try {
          const grades = await gradesApi.class(cls._id, { period: selectedPeriod })
          return {
            className: cls.name,
            averageScore: grades?.data?.reduce((sum, grade) => sum + (grade.score || 0), 0) / (grades?.data?.length || 1),
            totalStudents: grades?.data?.length || 0
          }
        } catch (error) {
          return { className: cls.name, averageScore: 0, totalStudents: 0 }
        }
      }) || []
      
      const results = await Promise.all(performancePromises)
      return results.filter(r => r.totalStudents > 0)
    },
    enabled: selectedReport === 'performance' || selectedReport === 'overview'
  })

  // Class report
  const { data: classReport, isLoading: classLoading, error: classError, refetch: refetchClass } = useQuery({
    queryKey: ['reports', 'class', classId],
    queryFn: () => reportsApi.getClassReport(classId),
    enabled: selectedReport === 'class' && !!classId,
  })

  // Student report
  const { data: studentReport, isLoading: studentLoading, error: studentError, refetch: refetchStudent } = useQuery({
    queryKey: ['reports', 'student', studentId],
    queryFn: () => reportsApi.getStudentReport(studentId),
    enabled: selectedReport === 'student' && !!studentId,
  })

  // Attendance summary (by class)
  const { data: attendanceReport, isLoading: attendanceLoading, error: attendanceError, refetch: refetchAttendance } = useQuery({
    queryKey: ['reports', 'attendance', classId],
    queryFn: () => reportsApi.getAttendanceSummary(classId, { period: selectedPeriod }),
    enabled: selectedReport === 'attendance' && !!classId,
  })

  // Exams analytics
  const { data: examAnalytics, isLoading: examsLoading, error: examsError, refetch: refetchExams } = useQuery({
    queryKey: ['reports', 'exams', examId],
    queryFn: () => reportsApi.getExamAnalytics(examId),
    enabled: selectedReport === 'exams' && !!examId,
  })

  // All exams for overview
  const { data: allExams, isLoading: allExamsLoading } = useQuery({
    queryKey: ['reports', 'allExams', selectedPeriod],
    queryFn: async () => {
      try {
        const exams = await cbtApi.list({ status: 'completed', period: selectedPeriod })
        return exams?.data || []
      } catch (error) {
        return []
      }
    },
    enabled: selectedReport === 'overview'
  })

  // Extract overview-like numbers from financeData
  const overview = financeData?.data || {}
  const totalStudents = overview.totalStudents || 0
  const totalTeachers = overview.totalTeachers || 0
  const totalClasses = overview.totalClasses || 0
  const totalSubjects = overview.totalSubjects || 0
  const enrolledStudents = overview.enrolledStudents || 0
  const enrollmentRate = overview.enrollmentRate || 0
  const averageClassSize = overview.averageClassSize || 0
  const teacherStudentRatio = overview.teacherStudentRatio || 0

  const periodOptions = [
    { value: 'current', label: 'Current Academic Year' },
    { value: 'last', label: 'Last Academic Year' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'month', label: 'Last Month' },
  ]

  const reportTypes = [
    { value: 'overview', label: 'Overview Dashboard', icon: '📊' },
    { value: 'student', label: 'Student Report', icon: '🧑‍🎓' },
    { value: 'teacher', label: 'Teacher Workload', icon: '👨‍🏫' },
    { value: 'class', label: 'Class Capacity', icon: '🏫' },
    { value: 'subject', label: 'Subject Analysis', icon: '📖' },
    { value: 'attendance', label: 'Attendance (Class)', icon: '📅' },
    { value: 'exams', label: 'Exams Analytics', icon: '📝' },
    { value: 'performance', label: 'Performance Trends', icon: '📈' },
    { value: 'financial', label: 'Financial Reports', icon: '💰' },
  ]

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return <OverviewDashboard 
          financeData={financeData} 
          financialData={financialData}
          performanceData={performanceData}
          allExams={allExams}
          selectedPeriod={selectedPeriod}
        />
      case 'student':
        return (
          <Card className="p-6">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Student ID</label>
                <input className="w-full border rounded px-3 py-2" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enter studentId" />
              </div>
              <Button onClick={() => setStudentId((v) => v.trim())}>Load</Button>
            </div>
            {studentLoading && <LoadingSkeleton rows={4} />}
            {studentError && <ErrorState message={studentError.message} onRetry={() => refetchStudent()} />}
            {studentReport && (
              <div className="space-y-4">
                <AcademicPerformanceChart data={studentReport.data?.performance || []} />
              </div>
            )}
          </Card>
        )
      case 'teacher':
        return (
          <Card className="p-6">
            <TeacherWorkloadChart data={overview.teacherWorkload || []} />
          </Card>
        )
      case 'class':
        return (
          <Card className="p-6">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Class ID</label>
                <input className="w-full border rounded px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Enter classId" />
              </div>
              <Button onClick={() => setClassId((v) => v.trim())}>Load</Button>
            </div>
            {classLoading && <LoadingSkeleton rows={4} />}
            {classError && <ErrorState message={classError.message} onRetry={() => refetchClass()} />}
            {classReport && (
              <ClassCapacityChart data={classReport.data?.capacity || []} />
            )}
          </Card>
        )
      case 'subject':
        return (
          <Card className="p-6">
            <SubjectDistributionChart data={overview.subjectDistribution || []} />
          </Card>
        )
      case 'attendance':
        return (
          <Card className="p-6">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Class ID</label>
                <input className="w-full border rounded px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Enter classId" />
              </div>
              <Button onClick={() => setClassId((v) => v.trim())}>Load</Button>
            </div>
            {attendanceLoading && <LoadingSkeleton rows={4} />}
            {attendanceError && <ErrorState message={attendanceError.message} onRetry={() => refetchAttendance()} />}
            {attendanceReport && (
              <AttendanceTrendsChart data={attendanceReport.data?.trend || []} />
            )}
          </Card>
        )
      case 'exams':
        return (
          <Card className="p-6">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Exam ID</label>
                <input className="w-full border rounded px-3 py-2" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Enter examId" />
              </div>
              <Button onClick={() => setExamId((v) => v.trim())}>Load</Button>
            </div>
            {examsLoading && <LoadingSkeleton rows={4} />}
            {examsError && <ErrorState message={examsError.message} onRetry={() => refetchExams()} />}
            {examAnalytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Average Score</div>
                    <div className="text-2xl font-semibold">{(examAnalytics.data?.averageScore ?? 0).toFixed ? (examAnalytics.data.averageScore || 0).toFixed(1) : examAnalytics.data?.averageScore || 0}%</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Submissions</div>
                    <div className="text-2xl font-semibold">{examAnalytics.data?.count ?? examAnalytics.data?.submissions ?? 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Total Marks</div>
                    <div className="text-2xl font-semibold">{examAnalytics.data?.totalMarks ?? '-'}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Pass Rate</div>
                    <div className="text-2xl font-semibold text-green-600">
                      {examAnalytics.data?.passRate ? `${examAnalytics.data.passRate}%` : 'N/A'}
                    </div>
                  </Card>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RBarChart data={(examAnalytics.data?.distribution && Object.keys(examAnalytics.data.distribution).map(k => ({ range: k, count: examAnalytics.data.distribution[k] }))) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </RBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        )
      case 'performance':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Performance Trends</h3>
            {performanceLoading && <LoadingSkeleton rows={4} />}
            {performanceError && <ErrorState message={performanceError.message} onRetry={() => {}} />}
            {performanceData && (
              <StudentPerformanceTrendsChart data={performanceData} />
            )}
          </Card>
        )
      case 'financial':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Reports</h3>
            {financialLoading && <LoadingSkeleton rows={4} />}
            {financialError && <ErrorState message={financialError.message} onRetry={() => {}} />}
            {financialData && (
              <FinancialTrendsChart data={financialData} selectedPeriod={selectedPeriod} />
            )}
          </Card>
        )
      default:
        return <OverviewDashboard 
          financeData={financeData} 
          financialData={financialData}
          performanceData={performanceData}
          allExams={allExams}
          selectedPeriod={selectedPeriod}
        />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights and analytics for school management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            📄 Export Report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Generate PDF report
              console.log('Generating PDF report...')
            }}
          >
            📊 Generate PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Period:</span>
          <div className="flex gap-2">
            {periodOptions.map(option => (
              <Button
                key={option.value}
                variant={selectedPeriod === option.value ? 'solid' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Report Type Selector */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
          {reportTypes.map(type => (
            <Button
              key={type.value}
              variant={selectedReport === type.value ? 'solid' : 'outline'}
              className="flex flex-col items-center p-3 h-auto"
              onClick={() => setSelectedReport(type.value)}
            >
              <span className="text-lg mb-1">{type.icon}</span>
              <span className="text-xs text-center">{type.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Key Metrics Overview (from financeData) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teachers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTeachers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalClasses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Subjects</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalSubjects}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrollment Rate</p>
            <p className="text-3xl font-bold text-blue-600">{enrollmentRate}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enrolledStudents} of {totalStudents} students enrolled
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Class Size</p>
            <p className="text-3xl font-bold text-green-600">{averageClassSize}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              students per class
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teacher-Student Ratio</p>
            <p className="text-3xl font-bold text-purple-600">{teacherStudentRatio}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              students per teacher
            </p>
          </div>
        </Card>
      </div>

      {/* Report Content */}
      <div className="mt-8">
        {financeLoading && <Card className="p-6"><LoadingSkeleton rows={6} /></Card>}
        {financeError && <Card className="p-6"><ErrorState message={financeError.message} onRetry={() => refetchFinance()} /></Card>}
        {!financeLoading && !financeError && renderReportContent()}
      </div>
    </div>
  )
}

export default ReportsPage

// Enhanced Overview Dashboard Component
function OverviewDashboard({ financeData, financialData, performanceData, allExams, selectedPeriod }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview Dashboard</h2>
      
      {/* Exam Analytics Overview */}
      {allExams && allExams.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Exam Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{allExams.length}</div>
              <div className="text-sm text-blue-600">Total Exams</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {allExams.filter(exam => exam.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {allExams.filter(exam => exam.status === 'active').length}
              </div>
              <div className="text-sm text-purple-600">Active</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {allExams.filter(exam => exam.status === 'draft').length}
              </div>
              <div className="text-sm text-orange-600">Draft</div>
            </div>
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrollment Trends</h3>
          <EnrollmentChart />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Capacity Utilization</h3>
          <ClassCapacityChart data={financeData?.data?.classCapacity || []} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Distribution</h3>
          <SubjectDistributionChart data={financeData?.data?.subjectDistribution || []} />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teacher Workload</h3>
          <TeacherWorkloadChart data={financeData?.data?.teacherWorkload || []} />
        </Card>
      </div>

      {/* Performance Trends */}
      {performanceData && performanceData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Performance Trends</h3>
          <StudentPerformanceTrendsChart data={performanceData} />
        </Card>
      )}

      {/* Financial Overview */}
      {financialData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h3>
          <FinancialTrendsChart data={financialData} selectedPeriod={selectedPeriod} />
        </Card>
      )}
    </div>
  )
}
