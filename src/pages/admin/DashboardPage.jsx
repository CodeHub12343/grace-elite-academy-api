import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, paymentsApi } from '../../lib/api'
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Users, GraduationCap, Wallet, AlertTriangle, Clock, Download, TrendingUp, BookOpen, Calendar, DollarSign, Activity, FileText, Award, Target, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

function KpiCard({ icon: Icon, label, value, subtitle, accent = 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 ${accent}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-md bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-70 truncate">{label}</div>
          <div className="text-lg sm:text-2xl font-semibold truncate">{value}</div>
          {subtitle && <div className="text-xs opacity-60 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export function DashboardPage() {
  const [period, setPeriod] = useState('30d')
  const [granularity, setGranularity] = useState('monthly')

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'admin', period, granularity],
    queryFn: () => reportsApi.getGeneralReports({ scope: 'admin', period, granularity }),
  })

  // Fetch payment analytics
  const { data: paymentAnalytics, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-analytics', period],
    queryFn: () => paymentsApi.analytics({ period }),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true
  })

  const reportsData = data?.data || {}
  const counts = reportsData.counts || {}
  const attendanceToday = reportsData.attendanceToday || {}
  const finance = reportsData.finance || {}
  const recentPayments = reportsData.recentPayments || []
  const topClassesByAttendance = reportsData.topClassesByAttendance || []
  const examsSummary = reportsData.examsSummary || {}
  const notificationsSummary = reportsData.notificationsSummary || []

  // Payment analytics data
  const paymentData = paymentAnalytics?.data || {}
  const paymentSummary = paymentData.summary || {}
  const paymentRecentPayments = paymentData.recentPayments || []
  const paymentBreakdowns = paymentData.breakdowns || {}
  const paymentTrends = paymentData.trends || {}

  // Transform data for charts
  const financialTrend = useMemo(() => {
    // Use real payment data if available, otherwise mock data
    if (paymentTrends.daily && paymentTrends.daily.length > 0) {
      return paymentTrends.daily.map(item => ({
        date: `${item._id.day}/${item._id.month}`,
        revenue: item.totalAmount || 0,
        expenses: 0, // Not available in payment data
        profit: item.totalAmount || 0
      }))
    }
    // Fallback mock data
    return [
      { date: 'Jan', revenue: 150000, expenses: 120000, profit: 30000 },
      { date: 'Feb', revenue: 180000, expenses: 140000, profit: 40000 },
      { date: 'Mar', revenue: 200000, expenses: 160000, profit: 40000 },
      { date: 'Apr', revenue: 220000, expenses: 170000, profit: 50000 },
    ]
  }, [paymentTrends.daily])

  const attendanceTrend = useMemo(() => {
    // Mock data for attendance trends since not provided in API
    return [
      { date: 'Mon', present: 450, absent: 50, total: 500 },
      { date: 'Tue', present: 420, absent: 80, total: 500 },
      { date: 'Wed', present: 480, absent: 20, total: 500 },
      { date: 'Thu', present: 460, absent: 40, total: 500 },
      { date: 'Fri', present: 440, absent: 60, total: 500 },
    ]
  }, [])

  const academicPerformance = useMemo(() => {
    // Mock data for academic performance since not provided in API
    return [
      { subject: 'Mathematics', average: 85, count: 120 },
      { subject: 'English', average: 78, count: 120 },
      { subject: 'Science', average: 82, count: 120 },
      { subject: 'History', average: 75, count: 120 },
    ]
  }, [])

  const gradeDistribution = useMemo(() => {
    // Mock data for grade distribution since not provided in API
    return [
      { grade: 'A', count: 45 },
      { grade: 'B', count: 60 },
      { grade: 'C', count: 35 },
      { grade: 'D', count: 20 },
      { grade: 'F', count: 10 },
    ]
  }, [])

  const examPerformance = useMemo(() => {
    // Mock data for exam performance since not provided in API
    return [
      { subject: 'Math', average: 88, total: 100 },
      { subject: 'English', average: 82, total: 100 },
      { subject: 'Science', average: 85, total: 100 },
      { subject: 'History', average: 79, total: 100 },
    ]
  }, [])

  const attendanceRanking = useMemo(() => {
    return topClassesByAttendance.map((item, index) => ({
      class: `Class ${item.classId?.slice(-3) || index + 1}`,
      percentage: Math.round(item.attendanceRate || 0),
      rank: index + 1
    }))
  }, [topClassesByAttendance])

  const performancePredictions = useMemo(() => {
    // Mock data for performance predictions since not provided in API
    return [
      { subject: 'Mathematics', predicted: 87, confidence: 85 },
      { subject: 'English', predicted: 80, confidence: 78 },
      { subject: 'Science', predicted: 84, confidence: 82 },
      { subject: 'History', predicted: 76, confidence: 75 },
    ]
  }, [])

  const [activeTab, setActiveTab] = useState('overview')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-500">Loading comprehensive dashboard data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        Error loading dashboard: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Period:</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Granularity:</label>
            <select 
              value={granularity} 
              onChange={(e) => setGranularity(e.target.value)}
              className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          Period: {period} • Granularity: {granularity}
        </div>
        <div className="text-xs text-gray-500 sm:hidden">
          {period} • {granularity}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          icon={Users} 
          label="Total Students" 
          value={counts.totalStudents || 0}
          subtitle="Active students"
        />
        <KpiCard 
          icon={GraduationCap} 
          label="Total Teachers" 
          value={counts.totalTeachers || 0}
          subtitle="Active teachers"
        />
        <KpiCard 
          icon={BookOpen} 
          label="Classes & Subjects" 
          value={`${counts.totalClasses || 0} / ${counts.totalSubjects || 0}`}
          subtitle="Classes / Subjects"
        />
        <KpiCard 
          icon={DollarSign} 
          label="Total Revenue" 
          value={`₦${(paymentSummary.totalAmount || finance.totalRevenue || 0).toLocaleString()}`}
          subtitle={`${paymentSummary.successfulPayments || finance.successfulPaymentsCount || 0} successful payments`}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          icon={FileText} 
          label="Upcoming Exams" 
          value={examsSummary.upcomingExamsCount || 0}
          subtitle={`${examsSummary.recentExamsCount || 0} recent exams`}
          accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <KpiCard 
          icon={Activity} 
          label="Pending Payments" 
          value={paymentSummary.pendingPayments || 0}
          subtitle={`₦${((paymentSummary.totalAmount || 0) - (paymentSummary.successfulAmount || 0)).toLocaleString()} pending`}
          accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        />
        <KpiCard 
          icon={Calendar} 
          label="Notifications" 
          value={notificationsSummary.length || 0}
          subtitle={`${notificationsSummary.filter(n => n.status === 'pending').length || 0} pending`}
          accent="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        />
        <KpiCard 
          icon={Target} 
          label="Top Class Attendance" 
          value={`${Math.round(topClassesByAttendance[0]?.attendanceRate || 0)}%`}
          subtitle={`${topClassesByAttendance.length || 0} classes tracked`}
          accent="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Notifications</h3>
              <div className="text-sm text-gray-500">
                {notificationsSummary.length} total
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificationsSummary.slice(0, 5).map((notification, index) => (
                <div key={notification._id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.status === 'pending' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {notificationsSummary.length === 0 && (
                <div className="text-center text-gray-500 py-4">No notifications</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Payments</h3>
              <div className="text-sm text-gray-500">
                {paymentRecentPayments.length || recentPayments.length} total
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(paymentRecentPayments.length > 0 ? paymentRecentPayments : recentPayments).slice(0, 5).map((payment, index) => (
                <div key={payment._id || index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'success' ? 'bg-green-400' : 
                      payment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.studentId?.userId?.name || payment.studentId?.slice(-3) || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.paymentMethod || 'Unknown method'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₦{(payment.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(paymentRecentPayments.length === 0 && recentPayments.length === 0) && (
                <div className="text-center text-gray-500 py-4">No recent payments</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Financial Trend */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">Financial Performance</h3>
              <div className="text-xs sm:text-sm text-gray-500">
                ₦{(paymentSummary.totalAmount || finance.totalRevenue || 0).toLocaleString()} total
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expenses" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">Attendance Overview</h3>
              <div className="text-xs sm:text-sm text-gray-500">
                {Math.round(topClassesByAttendance[0]?.attendanceRate || 0)}% best class
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Payment Status Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentBreakdowns.byStatus?.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium text-sm capitalize">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.count} payments</div>
                    <div className="text-xs text-gray-500">₦{item.totalAmount?.toLocaleString() || '0'}</div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">No payment data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment Methods</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentBreakdowns.byPaymentMethod?.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="font-medium text-sm">{item._id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.count} payments</div>
                    <div className="text-xs text-gray-500">₦{item.totalAmount?.toLocaleString() || '0'}</div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-4">No payment data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Payments</span>
                <span className="font-medium text-gray-900 dark:text-white">{paymentSummary.totalPayments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">{paymentSummary.successRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Average Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">₦{paymentSummary.averageAmount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending Amount</span>
                <span className="font-medium text-yellow-600">₦{((paymentSummary.totalAmount || 0) - (paymentSummary.successfulAmount || 0)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance & Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Academic Performance by Subject */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Academic Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={academicPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="subject" type="category" stroke="#9ca3af" width={60} fontSize={12} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="average" fill="#3B82F6" radius={[0,4,4,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Grade Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ grade, percent }) => `${grade} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Ranking */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Class Attendance Ranking</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceRanking.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{item.class}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.percentage}%</div>
                  </div>
                </div>
              ))}
              {attendanceRanking.length === 0 && (
                <div className="text-center text-gray-500 py-4">No attendance data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance & Predictions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Exam Performance by Subject */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Exam Performance by Subject</h3>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={examPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="subject" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="average" fill="#8B5CF6" radius={[4,4,0,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Predictions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Performance Predictions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performancePredictions.slice(0, 5).map((pred, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="font-medium text-sm">{pred.subject}</div>
                    <div className="text-xs text-gray-500">Confidence: {pred.confidence}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{pred.predicted}%</div>
                    <div className="text-xs text-gray-500">Predicted</div>
                  </div>
                </div>
              ))}
              {performancePredictions.length === 0 && (
                <div className="text-center text-gray-500 py-4">No prediction data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Tab */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'overview' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'financial' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('financial')}
              >
                Financial
              </button>
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'academic' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('academic')}
              >
                Academic
              </button>
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'attendance' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('attendance')}
              >
                Attendance
              </button>
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'exams' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('exams')}
              >
                Exams
              </button>
              <button 
                className={`px-2 sm:px-3 py-1.5 rounded-md border text-xs sm:text-sm ${activeTab === 'operations' ? 'border-primary text-primary' : ''}`} 
                onClick={() => setActiveTab('operations')}
              >
                Operations
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-2 sm:px-3 py-1.5 rounded-md border flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" /> 
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button className="px-2 sm:px-3 py-1.5 rounded-md border flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" /> 
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Students</div>
                  <div className="text-2xl font-bold">{counts.totalStudents || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Teachers</div>
                  <div className="text-2xl font-bold">{counts.totalTeachers || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Classes</div>
                  <div className="text-2xl font-bold">{counts.totalClasses || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Subjects</div>
                  <div className="text-2xl font-bold">{counts.totalSubjects || 0}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Revenue</div>
                  <div className="text-2xl font-bold">₦{(paymentSummary.totalAmount || finance.totalRevenue || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium">Total Payments</div>
                  <div className="text-2xl font-bold">{paymentSummary.totalPayments || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Successful Payments</div>
                  <div className="text-2xl font-bold">{paymentSummary.successfulPayments || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Pending Payments</div>
                  <div className="text-2xl font-bold">{paymentSummary.pendingPayments || 0}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Success Rate</div>
                  <div className="text-2xl font-bold">{paymentSummary.successRate || 0}%</div>
                </div>
                <div>
                  <div className="font-medium">Average Amount</div>
                  <div className="text-2xl font-bold">₦{paymentSummary.averageAmount?.toLocaleString() || '0'}</div>
                </div>
                <div>
                  <div className="font-medium">Pending Amount</div>
                  <div className="text-2xl font-bold text-yellow-600">₦{((paymentSummary.totalAmount || 0) - (paymentSummary.successfulAmount || 0)).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Subjects</div>
                  <div className="text-2xl font-bold">{counts.totalSubjects || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Classes</div>
                  <div className="text-2xl font-bold">{counts.totalClasses || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Upcoming Exams</div>
                  <div className="text-2xl font-bold">{examsSummary.upcomingExamsCount || 0}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Classes Tracked</div>
                  <div className="text-2xl font-bold">{topClassesByAttendance.length || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Best Attendance</div>
                  <div className="text-2xl font-bold">{Math.round(topClassesByAttendance[0]?.attendanceRate || 0)}%</div>
                </div>
                <div>
                  <div className="font-medium">Average Attendance</div>
                  <div className="text-2xl font-bold">
                    {topClassesByAttendance.length > 0 ? 
                      Math.round(topClassesByAttendance.reduce((sum, item) => sum + (item.attendanceRate || 0), 0) / topClassesByAttendance.length) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Upcoming Exams</div>
                  <div className="text-2xl font-bold">{examsSummary.upcomingExamsCount || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Recent Exams</div>
                  <div className="text-2xl font-bold">{examsSummary.recentExamsCount || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Exams</div>
                  <div className="text-2xl font-bold">{(examsSummary.upcomingExamsCount || 0) + (examsSummary.recentExamsCount || 0)}</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'operations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-2xl font-bold">{notificationsSummary.length || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Pending Notifications</div>
                  <div className="text-2xl font-bold">{notificationsSummary.filter(n => n.status === 'pending').length || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Recent Payments</div>
                  <div className="text-2xl font-bold">{recentPayments.length || 0}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
