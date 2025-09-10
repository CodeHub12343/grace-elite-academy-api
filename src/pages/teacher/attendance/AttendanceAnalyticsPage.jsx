import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Calendar, Target, AlertTriangle, Download, Filter, Clock, CheckCircle } from 'lucide-react'
import { attendanceApi, reportsApi } from '../../../lib/api'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function AttendanceAnalyticsPage() {
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [viewMode, setViewMode] = useState('overview') // 'overview', 'trends', 'individual', 'comparison'

  // Fetch attendance analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['attendance-analytics', selectedClass, selectedStudent, dateRange],
    queryFn: async () => {
      if (selectedClass !== 'all') {
        return reportsApi.getAttendanceSummary(selectedClass, { days: dateRange === 'all' ? undefined : dateRange })
      }
      return attendanceApi.getAttendanceReport({ days: dateRange === 'all' ? undefined : dateRange })
    }
  })

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Fetch students for selected class
  const { data: students } = useQuery({
    queryKey: ['students', 'class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return []
      const response = await api.get(`/classes/${selectedClass}/students`)
      return response.data
    },
    enabled: !!selectedClass
  })

  const handleExportAnalytics = () => {
    const csvContent = convertAnalyticsToCSV(analytics)
    downloadCSV(csvContent, `attendance-analytics-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const convertAnalyticsToCSV = (data) => {
    if (!data) return ''
    
    const headers = ['Metric', 'Value', 'Change', 'Percentage']
    const rows = [
      ['Total Students', data.totalStudents, data.studentsChange, `${data.studentsPercentage}%`],
      ['Average Attendance', data.averageAttendance, data.attendanceChange, `${data.attendancePercentage}%`],
      ['Present Rate', data.presentRate, data.presentRateChange, `${data.presentRatePercentage}%`],
      ['Absent Rate', data.absentRate, data.absentRateChange, `${data.absentRatePercentage}%`],
      ['Late Rate', data.lateRate, data.lateRateChange, `${data.lateRatePercentage}%`]
    ]
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100'
      case 'absent': return 'text-red-600 bg-red-100'
      case 'late': return 'text-yellow-600 bg-yellow-100'
      case 'excused': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and trends analysis for student attendance
          </p>
        </div>
        
        <Button
          onClick={handleExportAnalytics}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Classes</option>
                              {classes?.data?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Students</option>
              {students?.map(student => (
                <option key={student._id} value={student._id}>{student.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'overview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'trends'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'individual'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Comparison
          </button>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.totalStudents || 0}
              </p>
              <p className={`text-xs ${analytics?.studentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics?.studentsChange >= 0 ? '+' : ''}{analytics?.studentsChange || 0} from last period
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.averageAttendance?.toFixed(1) || 0}%
              </p>
              <p className={`text-xs ${analytics?.attendanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics?.attendanceChange >= 0 ? '+' : ''}{analytics?.attendanceChange?.toFixed(1) || 0}% from last period
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.presentRate?.toFixed(1) || 0}%
              </p>
              <p className={`text-xs ${analytics?.presentRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics?.presentRateChange >= 0 ? '+' : ''}{analytics?.presentRateChange?.toFixed(1) || 0}% from last period
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.absentRate?.toFixed(1) || 0}%
              </p>
              <p className={`text-xs ${analytics?.absentRateChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analytics?.absentRateChange >= 0 ? '+' : ''}{analytics?.absentRateChange?.toFixed(1) || 0}% from last period
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.lateRate?.toFixed(1) || 0}%
              </p>
              <p className={`text-xs ${analytics?.lateRateChange >= 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {analytics?.lateRateChange >= 0 ? '+' : ''}{analytics?.lateRateChange?.toFixed(1) || 0}% from last period
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.attendanceDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.attendanceDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Attendance by Day of Week */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance by Day of Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.dayOfWeekAttendance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Attendees */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Attendees</h3>
            <div className="space-y-3">
              {analytics?.topAttendees?.slice(0, 5).map((student, index) => (
                <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.attendanceRate}%
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attendance Issues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Issues</h3>
            <div className="space-y-3">
              {analytics?.attendanceIssues?.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.studentName}
                    </p>
                    <p className="text-xs text-gray-500">{issue.issue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {issue.absenceCount} absences
                    </p>
                    <p className="text-xs text-gray-500">Last {issue.daysSinceLast} days</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trend Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Attendance Pattern */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.monthlyPattern || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF4444" fill="#EF4444" />
                <Area type="monotone" dataKey="late" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {viewMode === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual Student Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.studentPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#8B5CF6" />
                <Bar dataKey="present" fill="#10B981" />
                <Bar dataKey="absent" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Attendance Patterns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Patterns</h3>
            <div className="space-y-4">
              {analytics?.attendancePatterns?.map((pattern, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {pattern.pattern}
                    </h4>
                    <span className="text-xs text-gray-500">{pattern.studentCount} students</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${pattern.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pattern.percentage}% of students</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Attendance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.classComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#3B82F6" />
                <Bar dataKey="present" fill="#10B981" />
                <Bar dataKey="absent" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Time-based Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time-based Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.timeComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="morning" fill="#3B82F6" />
                <Bar dataKey="afternoon" fill="#10B981" />
                <Bar dataKey="evening" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics?.recommendations?.map((rec, index) => (
            <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {rec.title}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}



