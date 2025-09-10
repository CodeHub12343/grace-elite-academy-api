import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  PieChart,
  TrendingDown
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { InvoiceGenerator } from '../../components/ui/InvoiceGenerator'
import { PaymentHistory } from '../../components/ui/PaymentHistory'
import { LateFeeCalculator } from '../../components/ui/LateFeeCalculator'
import { SplitPaymentSupport } from '../../components/ui/SplitPaymentSupport'
import { api } from '../../lib/axios'
import { paymentsApi } from '../../lib/api'
import { PaystackPaymentModal } from '../../components/ui/PaystackPaymentModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

function StatCard({ icon: Icon, label, value, subtitle, trend, accent = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 ${accent}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="p-2 sm:p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
          <span className={`flex items-center ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : trend < 0 ? <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : null}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-gray-500 ml-2 hidden sm:inline">vs last period</span>
        </div>
      )}
    </div>
  )
}

export default function PaymentManagementPage() {
  const [viewMode, setViewMode] = useState('overview') // overview, payments, analytics, invoices
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false)
  const [showLateFeeModal, setShowLateFeeModal] = useState(false)
  const [studentIdFilter, setStudentIdFilter] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30',
    minAmount: '',
    maxAmount: '',
    search: ''
  })

  // Fetch payment analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['payment-analytics', filters],
    queryFn: () => paymentsApi.analytics(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true
  })

  // Fetch payment data for detailed view
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', studentIdFilter, filters],
    queryFn: async () => {
      if (studentIdFilter) {
        return paymentsApi.history(studentIdFilter, {
          status: filters.status !== 'all' ? filters.status : undefined,
          days: filters.dateRange !== 'all' ? filters.dateRange : undefined,
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined,
          search: filters.search || undefined,
        })
      }
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.dateRange !== 'all') params.append('days', filters.dateRange)
      if (filters.minAmount) params.append('minAmount', filters.minAmount)
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)
      if (filters.search) params.append('search', filters.search)
      const response = await api.get(`/payments/admin?${params.toString()}`)
      return response.data
    },
  })

  const analyticsData = analytics?.data || {}
  const summary = analyticsData.summary || {}
  const breakdowns = analyticsData.breakdowns || {}
  const trends = analyticsData.trends || {}
  const topStudents = analyticsData.topStudents || []
  const recentPayments = analyticsData.recentPayments || []
  const failedPayments = analyticsData.failedPayments || []

  // Transform data for charts
  const statusBreakdown = useMemo(() => {
    return breakdowns.byStatus?.map(item => ({
      status: item._id,
      count: item.count,
      amount: item.totalAmount,
      percentage: item.percentage
    })) || []
  }, [breakdowns.byStatus])

  const classBreakdown = useMemo(() => {
    return breakdowns.byClass?.map(item => ({
      class: item._id,
      count: item.count,
      amount: item.totalAmount
    })) || []
  }, [breakdowns.byClass])

  const paymentMethodBreakdown = useMemo(() => {
    return breakdowns.byPaymentMethod?.map(item => ({
      method: item._id,
      count: item.count,
      amount: item.totalAmount
    })) || []
  }, [breakdowns.byPaymentMethod])

  const dailyTrends = useMemo(() => {
    return trends.daily?.map(item => ({
      date: `${item._id.day}/${item._id.month}`,
      count: item.count,
      amount: item.totalAmount
    })) || []
  }, [trends.daily])

  const monthlyTrends = useMemo(() => {
    return trends.monthly?.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count,
      amount: item.totalAmount
    })) || []
  }, [trends.monthly])

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData)
    setShowPaymentModal(false)
    refetchAnalytics()
    refetchPayments()
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    setShowPaymentModal(false)
    alert('Payment failed: ' + (error.message || 'Unknown error'))
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'refunded':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
        return CheckCircle
      case 'pending':
        return Clock
      case 'failed':
        return XCircle
      default:
        return Clock
    }
  }

  const verifyPayment = async (payment) => {
    try {
      const reference = payment?.paystackReference || payment?.reference || payment?.transactionId
      if (!reference) throw new Error('Missing transaction reference')
      await paymentsApi.verify(reference)
      try { window?.toast?.success?.('Verification complete') } catch {}
      refetchAnalytics()
      refetchPayments()
    } catch (e) {
      try { window?.toast?.error?.(e.message) } catch {}
    }
  }

  const exportAnalytics = () => {
    if (!analyticsData) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Payments', summary.totalPayments || 0],
      ['Total Amount', formatCurrency(summary.totalAmount || 0)],
      ['Successful Payments', summary.successfulPayments || 0],
      ['Pending Payments', summary.pendingPayments || 0],
      ['Failed Payments', summary.failedPayments || 0],
      ['Success Rate', `${summary.successRate || 0}%`],
      ['Average Amount', formatCurrency(summary.averageAmount || 0)],
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          icon={DollarSign} 
          label="Total Revenue" 
          value={formatCurrency(summary.totalAmount || 0)}
          subtitle={`${summary.totalPayments || 0} payments`}
          accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        />
        <StatCard 
          icon={CheckCircle} 
          label="Successful Payments" 
          value={summary.successfulPayments || 0}
          subtitle={`${summary.successfulAmount ? formatCurrency(summary.successfulAmount) : '₦0'} collected`}
          accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard 
          icon={Clock} 
          label="Pending Payments" 
          value={summary.pendingPayments || 0}
          subtitle={`${formatCurrency((summary.totalAmount || 0) - (summary.successfulAmount || 0))} pending`}
          accent="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Success Rate" 
          value={`${summary.successRate || 0}%`}
          subtitle={`₦${summary.averageAmount ? summary.averageAmount.toLocaleString() : '0'} average`}
          accent="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Payment Status Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">Payment Status Breakdown</h3>
              <div className="text-xs sm:text-sm text-gray-500">
                {summary.totalPayments || 0} total payments
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status} ${percentage}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">Daily Payment Trends</h3>
              <div className="text-xs sm:text-sm text-gray-500">
                Last {dailyTrends.length} days
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class and Method Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* By Class */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Payments by Class</h3>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="class" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Payment Method */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Payment Methods</h3>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="method" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Students and Recent Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Students */}
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Top Students by Payment Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {topStudents.slice(0, 5).map((student, index) => (
                <div key={student._id.studentId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{student._id.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">{student._id.rollNumber}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-medium">{student.paymentCount} payments</p>
                    <p className="text-xs text-gray-500">{student.successfulCount} successful</p>
                  </div>
                </div>
              ))}
              {topStudents.length === 0 && (
                <div className="text-center text-gray-500 py-4">No payment data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">Recent Payments</h3>
              <Button variant="outline" onClick={() => refetchAnalytics()} className="w-full sm:w-auto text-sm">Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((payment, index) => {
                const StatusIcon = getStatusIcon(payment.status)
                return (
                  <div key={payment._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                        payment.status === 'success' ? 'text-green-500' :
                        payment.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">{payment.studentId?.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{payment.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs sm:text-sm font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
              {recentPayments.length === 0 && (
                <div className="text-center text-gray-500 py-4">No recent payments</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderPayments = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Payment Filters</h3>
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student ID Filter
              </label>
              <input
                value={studentIdFilter}
                onChange={(e) => setStudentIdFilter(e.target.value)}
                placeholder="Filter by Student ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Amount
              </label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Amount
              </label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="100000"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-8 sm:pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Search payments..."
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment History */}
      <PaymentHistory
        showFilters={false}
        showAnalytics={false}
      />
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Detailed Analytics</h3>
        <Button
          variant="outline"
          onClick={exportAnalytics}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Data</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <h3 className="text-base sm:text-lg font-semibold">Monthly Payment Trends</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Status Breakdown</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusBreakdown.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium text-xs sm:text-sm capitalize truncate">{item.status}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm font-medium">{item.count} payments</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Class Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classBreakdown.map((item, index) => (
                <div key={item.class} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs sm:text-sm truncate">{item.class}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm font-medium">{item.count} payments</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Payment Methods</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethodBreakdown.map((item, index) => (
                <div key={item.method} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs sm:text-sm truncate">{item.method}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm font-medium">{item.count} payments</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderInvoices = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Invoice Management</h3>
        <Button
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Generate Invoice</span>
          <span className="sm:hidden">Generate</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Invoice Generator</h4>
        </CardHeader>
        <CardContent>
          <InvoiceGenerator
            invoiceData={selectedPayment}
            showActions={true}
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (viewMode) {
      case 'payments':
        return renderPayments()
      case 'analytics':
        return renderAnalytics()
      case 'invoices':
        return renderInvoices()
      default:
        return renderOverview()
    }
  }

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-500">Loading payment analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Comprehensive payment analytics and management dashboard
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => refetchAnalytics()}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Payment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('overview')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            viewMode === 'overview'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Overview</span>
          <span className="sm:hidden">Overview</span>
        </button>
        
        <button
          onClick={() => setViewMode('payments')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            viewMode === 'payments'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Payments</span>
          <span className="sm:hidden">Payments</span>
        </button>
        
        <button
          onClick={() => setViewMode('analytics')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            viewMode === 'analytics'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Analytics</span>
          <span className="sm:hidden">Analytics</span>
        </button>
        
        <button
          onClick={() => setViewMode('invoices')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            viewMode === 'invoices'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Invoices</span>
          <span className="sm:hidden">Invoices</span>
        </button>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modals */}
      <PaystackPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={selectedPayment}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Invoice"
        size="xl"
      >
        <InvoiceGenerator
          invoiceData={selectedPayment}
          showActions={false}
        />
      </Modal>

      <Modal
        isOpen={showSplitPaymentModal}
        onClose={() => setShowSplitPaymentModal(false)}
        title="Split Payment"
        size="xl"
      >
        <SplitPaymentSupport
          totalAmount={selectedPayment?.amount || 10000}
          onSplitComplete={() => setShowSplitPaymentModal(false)}
          onCancel={() => setShowSplitPaymentModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showLateFeeModal}
        onClose={() => setShowLateFeeModal(false)}
        title="Calculate Late Fees"
        size="lg"
      >
        <LateFeeCalculator
          dueDate={selectedPayment?.dueDate}
          amount={selectedPayment?.amount}
          onApply={() => setShowLateFeeModal(false)}
        />
      </Modal>
    </div>
  )
}