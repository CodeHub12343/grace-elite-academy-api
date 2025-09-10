import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { adminAnalyticsApi } from '../../lib/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextInput } from '../../components/ui/TextInput'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../components/ui/ErrorState'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    term: '',
    academicYear: ''
  })

  // Dashboard Overview Query
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['admin-analytics-dashboard', dateRange],
    queryFn: () => adminAnalyticsApi.getDashboardOverview(dateRange),
    select: (response) => response.data,
  })

  // Academic Performance Query
  const { data: academicData, isLoading: academicLoading, error: academicError } = useQuery({
    queryKey: ['admin-analytics-academic', dateRange, filters],
    queryFn: () => adminAnalyticsApi.getAcademicPerformance({ ...dateRange, ...filters }),
    select: (response) => response.data,
  })

  // Financial Overview Query
  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['admin-analytics-financial', dateRange],
    queryFn: () => adminAnalyticsApi.getFinancialOverview(dateRange),
    select: (response) => response.data,
  })

  // Attendance Overview Query
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['admin-analytics-attendance', dateRange, filters],
    queryFn: () => adminAnalyticsApi.getAttendanceOverview({ ...dateRange, ...filters }),
    select: (response) => response.data,
  })

  // Teacher Performance Query
  const { data: teacherData, isLoading: teacherLoading, error: teacherError } = useQuery({
    queryKey: ['admin-analytics-teachers', dateRange],
    queryFn: () => adminAnalyticsApi.getTeacherPerformance(dateRange),
    select: (response) => response.data,
  })

  // Student Lifecycle Query
  const { data: studentData, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ['admin-analytics-students', dateRange],
    queryFn: () => adminAnalyticsApi.getStudentLifecycle(dateRange),
    select: (response) => response.data,
  })

  // Predictive Forecasts Query
  const { data: predictiveData, isLoading: predictiveLoading, error: predictiveError } = useQuery({
    queryKey: ['admin-analytics-predictive', dateRange],
    queryFn: () => adminAnalyticsApi.getPredictiveForecasts(dateRange),
    select: (response) => response.data,
  })

  // Real-time Metrics Query
  const { data: realtimeData, isLoading: realtimeLoading, error: realtimeError } = useQuery({
    queryKey: ['admin-analytics-realtime'],
    queryFn: () => adminAnalyticsApi.getRealtimeMetrics(),
    select: (response) => response.data,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Export Report Mutation
  const exportMutation = useMutation({
    mutationFn: (params) => adminAnalyticsApi.exportComprehensiveReport(params),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onError: (error) => {
      console.error('Export failed:', error)
    }
  })

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleExportReport = () => {
    exportMutation.mutate(dateRange)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'academic', label: 'Academic', icon: '🎓' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'students', label: 'Students', icon: '👨‍🎓' },
    { id: 'predictive', label: 'Predictive', icon: '🔮' },
    { id: 'realtime', label: 'Real-time', icon: '⚡' }
  ]

  const renderOverviewTab = () => {
    if (dashboardLoading) return <LoadingSkeleton />
    if (dashboardError) return <ErrorState error={dashboardError} />

    const { overview, financial, academic, attendance } = dashboardData || {}

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Students</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{overview?.totalStudents || 0}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                  <span className="text-lg sm:text-2xl">👨‍🎓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Teachers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{overview?.totalTeachers || 0}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-full flex-shrink-0">
                  <span className="text-lg sm:text-2xl">👨‍🏫</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white truncate">₦{(financial?.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full flex-shrink-0">
                  <span className="text-lg sm:text-2xl">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Attendance Rate</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{attendance?.attendanceRate || 0}%</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-full flex-shrink-0">
                  <span className="text-lg sm:text-2xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Academic Performance Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-base sm:text-lg font-semibold">Academic Performance Distribution</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Excellent (90%+)', value: academic?.distribution?.excellent || 0 },
                      { name: 'Good (70-89%)', value: academic?.distribution?.good || 0 },
                      { name: 'Average (50-69%)', value: academic?.distribution?.average || 0 },
                      { name: 'Poor (<50%)', value: academic?.distribution?.poor || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <h3 className="text-base sm:text-lg font-semibold">Financial Overview</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                  <span className="font-semibold text-sm sm:text-base truncate ml-2">₦{(financial?.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Payment</span>
                  <span className="font-semibold text-sm sm:text-base truncate ml-2">₦{(financial?.averagePayment || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Payments</span>
                  <span className="font-semibold text-sm sm:text-base">{financial?.paymentCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Outstanding Fees</span>
                  <span className="font-semibold text-sm sm:text-base text-red-600 truncate ml-2">₦{(financial?.outstanding?.totalOutstanding || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">System Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{overview?.activeExams || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Exams</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{overview?.pendingAssignments || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{overview?.systemNotifications || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">System Notifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAcademicTab = () => {
    if (academicLoading) return <LoadingSkeleton />
    if (academicError) return <ErrorState error={academicError} />

    const { overall, byClass, topStudents } = academicData || {}

    return (
      <div className="space-y-6">
        {/* Academic Performance Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Class"
                value={filters.classId}
                onChange={(e) => handleFilterChange('classId', e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  // Add class options from API
                ]}
              />
              <Select
                label="Subject"
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                options={[
                  { value: '', label: 'All Subjects' },
                  // Add subject options from API
                ]}
              />
              <Select
                label="Term"
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                options={[
                  { value: '', label: 'All Terms' },
                  { value: 'term1', label: 'Term 1' },
                  { value: 'term2', label: 'Term 2' },
                  { value: 'term3', label: 'Term 3' }
                ]}
              />
              <TextInput
                label="Academic Year"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                placeholder="2024-2025"
              />
            </div>
          </CardContent>
        </Card>

        {/* Overall Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{overall?.averageScore || 0}%</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{overall?.totalGrades || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Grades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{overall?.highestScore || 0}%</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Highest Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">{overall?.lowestScore || 0}%</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Lowest Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Class */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Performance by Class</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byClass || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#3B82F6" name="Average Score" />
                <Bar dataKey="excellentCount" fill="#10B981" name="Excellent (90%+)" />
                <Bar dataKey="goodCount" fill="#F59E0B" name="Good (70-89%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Students */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Top Performing Students</h3>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Grades</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Highest Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {(topStudents || []).slice(0, 10).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.studentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.rollNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.averageScore || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.totalGrades || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.highestScore || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="space-y-4">
                {(topStudents || []).slice(0, 10).map((student) => (
                  <div key={student._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {student.studentName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">Roll: {student.rollNumber || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{student.averageScore || 0}%</div>
                        <div className="text-xs text-gray-500">Average</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Total Grades</div>
                        <div className="font-medium">{student.totalGrades || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Highest Score</div>
                        <div className="font-medium">{student.highestScore || 0}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFinancialTab = () => {
    if (financialLoading) return <LoadingSkeleton />
    if (financialError) return <ErrorState error={financialError} />

    const { revenue, revenueByMonth, paymentMethods, feeCategories } = financialData || {}

    return (
      <div className="space-y-6">
        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">₦{(revenue?.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">₦{(revenue?.averagePayment || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Payment</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{revenue?.totalPayments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Payments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">₦{(revenue?.highestPayment || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Highest Payment</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Revenue Trends</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Payment Methods</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethods || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percentage }) => `${method} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalAmount"
                  >
                    {(paymentMethods || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Fee Categories</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(feeCategories || []).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{category.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${category.percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">₦{(category.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderAttendanceTab = () => {
    if (attendanceLoading) return <LoadingSkeleton />
    if (attendanceError) return <ErrorState error={attendanceError} />

    const { overall, byClass, poorAttendanceStudents } = attendanceData || {}

    return (
      <div className="space-y-6">
        {/* Attendance KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{overall?.attendanceRate || 0}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Attendance Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{overall?.presentCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{overall?.absentCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{overall?.lateCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Late</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance by Class */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Attendance by Class</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byClass || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendanceRate" fill="#10B981" name="Attendance Rate %" />
                <Bar dataKey="presentCount" fill="#3B82F6" name="Present" />
                <Bar dataKey="absentCount" fill="#EF4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Poor Attendance Students */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Students with Poor Attendance</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Absent</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {(poorAttendanceStudents || []).slice(0, 10).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.studentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.className || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.attendanceRate < 50 ? 'bg-red-100 text-red-800' :
                          student.attendanceRate < 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {student.attendanceRate || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.presentCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.absentCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTeachersTab = () => {
    if (teacherLoading) return <LoadingSkeleton />
    if (teacherError) return <ErrorState error={teacherError} />

    const { workload, reviews } = teacherData || {}

    return (
      <div className="space-y-6">
        {/* Teacher Workload */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Teacher Workload</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {(workload || []).slice(0, 10).map((teacher) => (
                    <tr key={teacher._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.teacherName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {teacher.classCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {teacher.subjectCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {teacher.totalStudents || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Reviews */}
        {reviews && reviews.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Teacher Reviews</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Reviews</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Excellent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {reviews.slice(0, 10).map((teacher) => (
                      <tr key={teacher._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {teacher.teacherName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <span className="text-yellow-400">⭐</span>
                            <span className="ml-1">{teacher.averageRating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {teacher.totalReviews || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {teacher.excellentReviews || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderStudentsTab = () => {
    if (studentLoading) return <LoadingSkeleton />
    if (studentError) return <ErrorState error={studentError} />

    const { enrollmentTrends, classDistribution, atRiskStudents } = studentData || {}

    return (
      <div className="space-y-6">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Enrollment Trends</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enrollmentCount" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Class Distribution</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="studentCount" fill="#10B981" name="Total Students" />
                <Bar dataKey="newEnrollments" fill="#3B82F6" name="New Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">At-Risk Students</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {(atRiskStudents || []).slice(0, 10).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.studentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.className || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.averageScore || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.attendanceRate || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (student.averageScore || 0) < 30 || (student.attendanceRate || 0) < 50 ? 'bg-red-100 text-red-800' :
                          (student.averageScore || 0) < 50 || (student.attendanceRate || 0) < 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {(student.averageScore || 0) < 30 || (student.attendanceRate || 0) < 50 ? 'High Risk' :
                           (student.averageScore || 0) < 50 || (student.attendanceRate || 0) < 75 ? 'Medium Risk' :
                           'Low Risk'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPredictiveTab = () => {
    if (predictiveLoading) return <LoadingSkeleton />
    if (predictiveError) return <ErrorState error={predictiveError} />

    const { revenue, performance, attendance } = predictiveData || {}

    return (
      <div className="space-y-6">
        {/* Revenue Forecasts */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Revenue Forecasts</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={[...(revenue?.historical || []), ...(revenue?.forecasts || [])]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray={revenue?.forecasts?.length ? "5 5" : "0"}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Performance Trends</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageScore" stroke="#10B981" strokeWidth={2} name="Average Score" />
                <Line type="monotone" dataKey="excellentRate" stroke="#F59E0B" strokeWidth={2} name="Excellent Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Attendance Trends</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendance?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendanceRate" stroke="#8B5CF6" strokeWidth={2} name="Attendance Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderRealtimeTab = () => {
    if (realtimeLoading) return <LoadingSkeleton />
    if (realtimeError) return <ErrorState error={realtimeError} />

    const { realtime, weeklyTrends, recentActivities } = realtimeData || {}

    return (
      <div className="space-y-6">
        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{realtime?.activeUsers || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{realtime?.todayEnrollments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today's Enrollments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">₦{(realtime?.todayPayments?.totalAmount || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{realtime?.todayAttendance?.attendanceRate || 0}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today's Attendance</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Weekly Enrollments</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTrends?.enrollments || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Weekly Payments</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyTrends?.payments || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="totalAmount" fill="#10B981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentActivities || []).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'alert' ? 'bg-red-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Comprehensive insights into your school's performance</p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={handleExportReport}
            disabled={exportMutation.isPending}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextInput
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
            <TextInput
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button
                onClick={() => {
                  const today = new Date()
                  const startOfYear = new Date(today.getFullYear(), 0, 1)
                  setDateRange({
                    startDate: startOfYear.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  })
                }}
                className="w-full"
              >
                Reset to Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'academic' && renderAcademicTab()}
        {activeTab === 'financial' && renderFinancialTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
        {activeTab === 'teachers' && renderTeachersTab()}
        {activeTab === 'students' && renderStudentsTab()}
        {activeTab === 'predictive' && renderPredictiveTab()}
        {activeTab === 'realtime' && renderRealtimeTab()}
      </div>
    </div>
  )
}
