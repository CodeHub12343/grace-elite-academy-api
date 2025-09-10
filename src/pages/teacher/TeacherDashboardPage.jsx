import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reportsApi, teacherAttendanceApi, teacherGradesApi } from '../../lib/api'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

// Modern KPI Card Component
function KpiCard({ label, value, subtitle, icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">{label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs sm:text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="mr-1">{trend > 0 ? '↗' : '↘'}</span>
                <span className="hidden sm:inline">{Math.abs(trend)}% from last month</span>
                <span className="sm:hidden">{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-2 sm:p-3 rounded-full bg-gradient-to-br ${colorClasses[color]} text-white flex-shrink-0`}>
              <span className="text-lg sm:text-xl">{icon}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Action Button Component
function QuickActionButton({ icon, label, to, onClick, color = 'blue' }) {
  const colorClasses = {
    blue: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700',
    green: 'hover:bg-green-50 hover:border-green-200 hover:text-green-700',
    purple: 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700',
    orange: 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
  }

  const content = (
    <div className={`flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 ${colorClasses[color]} group`}>
      <div className="text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium text-center leading-tight">{label}</span>
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return (
    <button onClick={onClick} className="w-full">
      {content}
    </button>
  )
}

// Attendance Status Badge
function AttendanceBadge({ status }) {
  const statusConfig = {
    present: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✓' },
    absent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '✗' },
    late: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '⏰' },
    excused: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '📝' }
  }

  const config = statusConfig[status] || statusConfig.absent

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {status}
    </span>
  )
}

// Grade Status Badge
function GradeBadge({ isPublished }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isPublished 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }`}>
      {isPublished ? '📢 Published' : '📝 Draft'}
    </span>
  )
}

export function TeacherDashboardPage() {
  const { data, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'teacher'],
    queryFn: () => reportsApi.getGeneralReports({ scope: 'teacher' }),
  })

  const { data: myAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['teacher-attendance','me'],
    queryFn: () => teacherAttendanceApi.mine({ startDate: new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10) }),
  })

  const { data: myGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['teacher-grades', 'my-grades'],
    queryFn: () => teacherGradesApi.getMyGrades({ limit: 10 }),
  })

  const cards = data?.data?.cards || {}

  const performanceTrend = useMemo(() => data?.data?.performanceTrend || [
    { week: 'Week 1', score: 68, students: 25 },
    { week: 'Week 2', score: 72, students: 28 },
    { week: 'Week 3', score: 75, students: 30 },
    { week: 'Week 4', score: 78, students: 32 },
  ], [data])

  const attendancePie = useMemo(() => {
    const attendance = data?.data?.charts?.attendanceToday || []
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    const excused = attendance.filter(a => a.status === 'excused').length
    return { present, absent, late, excused }
  }, [data])

  const pieData = [
    { name: 'Present', value: attendancePie.present, color: '#10B981' },
    { name: 'Absent', value: attendancePie.absent, color: '#EF4444' },
    { name: 'Late', value: attendancePie.late, color: '#F59E0B' },
    { name: 'Excused', value: attendancePie.excused, color: '#3B82F6' },
  ].filter(item => item.value > 0)

  const gradeDistribution = useMemo(() => {
    if (!myGrades?.data || !Array.isArray(myGrades.data)) {
      return []
    }
    
    const distribution = myGrades.data.reduce((acc, grade) => {
      acc[grade.grade] = (acc[grade.grade] || 0) + 1
      return acc
    }, {})

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      color: grade === 'A' ? '#10B981' : grade === 'B' ? '#3B82F6' : grade === 'C' ? '#F59E0B' : grade === 'D' ? '#F97316' : '#EF4444'
    }))
  }, [myGrades])

  if (reportsLoading || attendanceLoading || gradesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Welcome back, Teacher!</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Here's what's happening in your classes today</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
            <div className="text-blue-100 text-sm sm:text-base">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard 
          label="My Classes" 
          value={cards.classes ?? 0} 
          icon="🏫"
          color="blue"
          trend={5.2}
        />
        <KpiCard 
          label="Subjects" 
          value={cards.subjects ?? 0} 
          icon="📚"
          color="green"
          trend={2.1}
        />
        <KpiCard 
          label="Total Students" 
          value={cards.students ?? 0} 
          icon="👥"
          color="purple"
          trend={8.7}
        />
        <KpiCard 
          label="Upcoming Exams" 
          value={cards.upcomingExams ?? 0} 
          icon="📝"
          color="orange"
          trend={-1.3}
        />
      </div>

      {/* Attendance Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <span className="mr-2">📊</span>
              My Attendance (Last 30 Days)
            </h2>
            <Link to="/t/attendance">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{myAttendance?.summary?.present ?? 0}</div>
              <div className="text-xs sm:text-sm text-green-600">Present</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg sm:rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{myAttendance?.summary?.absent ?? 0}</div>
              <div className="text-xs sm:text-sm text-red-600">Absent</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{myAttendance?.summary?.late ?? 0}</div>
              <div className="text-xs sm:text-sm text-yellow-600">Late</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{myAttendance?.summary?.excused ?? 0}</div>
              <div className="text-xs sm:text-sm text-blue-600">Excused</div>
            </div>
          </div>

          {/* Recent Attendance Records */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Recent Records</h3>
            <div className="space-y-2">
              {(myAttendance?.data || []).slice(0, 5).map((record) => (
                <div key={record._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="text-xs sm:text-sm font-medium">
                      {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                    </div>
                    <AttendanceBadge status={record.status} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {record.remarks || 'No remarks'}
                  </div>
                </div>
              ))}
              {!(myAttendance?.data || []).length && (
                <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No attendance records found
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Student Performance Trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <span className="mr-2">📈</span>
              Student Performance Trend
            </h2>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <span className="mr-2">🥧</span>
              Attendance Distribution
            </h2>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={40} 
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 sm:mt-4 space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution and Recent Grades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <span className="mr-2">📊</span>
              Grade Distribution
            </h2>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="grade" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <span className="mr-2">🎯</span>
              Performance Metrics
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg sm:rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {cards.averageGradePercentage?.toFixed(1) ?? 0}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Grade</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-600">{cards.reviews?.count ?? 0}</div>
                  <div className="text-xs text-green-600">Total Reviews</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-600">{cards.reviews?.unresolved ?? 0}</div>
                  <div className="text-xs text-yellow-600">Unresolved</div>
                </div>
              </div>

              <div className="text-center p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-base sm:text-lg font-bold text-purple-600">
                  {cards.reviews?.avgRating?.toFixed(1) ?? 0}/5.0
                </div>
                <div className="text-xs text-purple-600">Average Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      {Array.isArray(myGrades?.data) && myGrades.data.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                <span className="mr-2">📝</span>
                Recent Grades
              </h2>
              <Link to="/t/grades">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {(Array.isArray(myGrades?.data) ? myGrades.data : []).map((grade) => (
                <div key={grade._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {grade.studentId?.userId?.name || grade.studentId?.rollNumber || '-'}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      grade.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      grade.grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      grade.grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      grade.grade === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {grade.grade}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div><span className="font-medium">Subject:</span> {grade.subjectId?.name || grade.subjectId?.code || '-'}</div>
                    <div><span className="font-medium">Class:</span> {grade.classId?.name || '-'}</div>
                    <div><span className="font-medium">Marks:</span> {grade.marks}/{grade.maxMarks} ({grade.percentage}%)</div>
                    <div className="flex items-center justify-between">
                      <span><span className="font-medium">Term:</span> {grade.term}</span>
                      <GradeBadge isPublished={grade.isPublished} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Marks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Term</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(myGrades?.data) ? myGrades.data : []).map((grade) => (
                    <tr key={grade._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {grade.studentId?.userId?.name || grade.studentId?.rollNumber || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 dark:text-white">
                          {grade.subjectId?.name || grade.subjectId?.code || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 dark:text-white">
                          {grade.classId?.name || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {grade.marks}/{grade.maxMarks}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ({grade.percentage}%)
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          grade.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          grade.grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          grade.grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          grade.grade === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-gray-900 dark:text-white">
                          {grade.term}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <GradeBadge isPublished={grade.isPublished} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg sm:text-xl font-semibold flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <QuickActionButton 
              icon="📝" 
              label="Add Assignment" 
              to="/t/assignments"
              color="blue"
            />
            <QuickActionButton 
              icon="📊" 
              label="Schedule Exam" 
              to="/t/exams"
              color="green"
            />
            <QuickActionButton 
              icon="✅" 
              label="Mark Attendance" 
              to="/t/attendance"
              color="purple"
            />
            <QuickActionButton 
              icon="📢" 
              label="Send Notice" 
              to="/t/notifications"
              color="orange"
            />
            <QuickActionButton 
              icon="📚" 
              label="Upload Grades" 
              to="/t/grades"
              color="blue"
            />
            <QuickActionButton 
              icon="📈" 
              label="View Results" 
              to="/t/results"
              color="green"
            />
            <QuickActionButton 
              icon="📁" 
              label="File Manager" 
              to="/t/files"
              color="purple"
            />
            <QuickActionButton 
              icon="⚙️" 
              label="Settings" 
              to="/t/settings"
              color="orange"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}