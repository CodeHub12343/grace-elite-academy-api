import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '../../lib/api'
import { api } from '../../lib/axios'
import { Button } from './Button'
import { Card } from './Card'
import { Modal } from './Modal'
import { 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Receipt,
  Eye,
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react'

export function PaymentHistory({ 
  studentId, 
  onViewReceipt, 
  onDownloadReceipt,
  showFilters = true,
  showAnalytics = true 
}) {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30',
    minAmount: '',
    maxAmount: '',
    search: ''
  })
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list, analytics

  // Fetch payment history
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', studentId, filters],
    queryFn: async () => {
      if (studentId) {
        // Student-specific history (v2): /api/payments/student/:id
        return paymentsApi.history(studentId, {
          status: filters.status !== 'all' ? filters.status : undefined,
          days: filters.dateRange !== 'all' ? filters.dateRange : undefined,
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined,
          search: filters.search || undefined,
        })
      }
      // Admin view: list all payments
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.dateRange !== 'all') params.append('days', filters.dateRange)
      if (filters.minAmount) params.append('minAmount', filters.minAmount)
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)
      if (filters.search) params.append('search', filters.search)
      const res = await api.get(`/payments/admin?${params.toString()}`)
      return res.data
    }
  })

  // Compute simple analytics on client for admin view
  const analytics = payments?.data ? {
    totalAmount: payments.data.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0),
    successfulPayments: payments.data.filter(p => p.status === 'success').length,
    pendingPayments: payments.data.filter(p => p.status === 'pending').length,
    failedPayments: payments.data.filter(p => p.status === 'failed').length,
  } : null

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment)
    setShowReceiptModal(true)
    if (onViewReceipt) {
      onViewReceipt(payment)
    }
  }

  const handleDownloadReceipt = (payment) => {
    if (onDownloadReceipt) {
      onDownloadReceipt(payment)
    } else {
      // Default receipt download
      const receiptData = {
        receiptNumber: payment.receiptNumber,
        studentName: payment.studentName,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status
      }
      
      // Generate and download receipt
      generateReceiptPDF(receiptData)
    }
  }

  const generateReceiptPDF = async (receiptData) => {
    try {
      const html2pdf = await import('html2pdf.js')
      
      const receiptHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">PAYMENT RECEIPT</h1>
            <p style="color: #666; margin: 10px 0 0 0;">School Management System</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
              Receipt #${receiptData.receiptNumber}
            </h2>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div>
              <h3 style="color: #333; margin: 0 0 10px 0;">Student Information</h3>
              <p><strong>Name:</strong> ${receiptData.studentName}</p>
              <p><strong>Receipt #:</strong> ${receiptData.receiptNumber}</p>
            </div>
            <div>
              <h3 style="color: #333; margin: 0 0 10px 0;">Payment Details</h3>
              <p><strong>Amount:</strong> ₦${receiptData.amount.toLocaleString()}</p>
              <p><strong>Date:</strong> ${new Date(receiptData.paymentDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Transaction Information</h3>
            <p><strong>Payment Method:</strong> ${receiptData.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${receiptData.transactionId}</p>
            <p><strong>Status:</strong> <span style="color: green;">${receiptData.status}</span></p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
            <p style="color: #666; margin: 0;">Thank you for your payment!</p>
            <p style="color: #666; margin: 5px 0 0 0;">This receipt serves as proof of payment.</p>
          </div>
        </div>
      `
      
      const opt = {
        margin: 0.5,
        filename: `receipt-${receiptData.receiptNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      await html2pdf.default().from(receiptHTML).set(opt).save()
    } catch (error) {
      console.error('Receipt generation failed:', error)
      alert('Failed to generate receipt. Please try again.')
    }
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
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
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
        return AlertCircle
      default:
        return Clock
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const exportPaymentHistory = () => {
    if (!payments?.data) return
    
    const csvContent = [
      ['Date', 'Receipt #', 'Description', 'Amount', 'Status', 'Payment Method', 'Transaction ID'],
      ...payments.data.map(payment => [
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.receiptNumber,
        payment.description,
        formatCurrency(payment.amount),
        payment.status,
        payment.paymentMethod,
        payment.transactionId
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFilters = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        <Filter className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Amount
          </label>
          <input
            type="number"
            value={filters.minAmount}
            onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Amount
          </label>
          <input
            type="number"
            value={filters.maxAmount}
            onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="100000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search payments..."
            />
          </div>
        </div>
      </div>
    </Card>
  )

  const renderAnalytics = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Analytics</h3>
        <Button
          variant="outline"
          onClick={exportPaymentHistory}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(analytics.totalAmount)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Paid</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.successfulPayments}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.pendingPayments}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analytics.failedPayments}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
          </div>
        </div>
      )}
    </Card>
  )

  const renderPaymentList = () => (
    <Card className="p-0">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h3>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      ) : payments?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Receipt #</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Description</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Amount</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Method</th>
                <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.data.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status)
                
                return (
                  <tr key={payment._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {payment.receiptNumber}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{payment.description}</div>
                        {payment.feeType && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.feeType} - {payment.academicYear} {payment.term}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="capitalize">{payment.status}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {payment.paymentMethod}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(payment)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReceipt(payment)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Receipt</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Payment List</span>
        </button>
        {showAnalytics && (
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'analytics'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Content */}
      {viewMode === 'analytics' ? renderAnalytics() : renderPaymentList()}

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title={`Receipt #${selectedPayment?.receiptNumber}`}
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Receipt #:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {selectedPayment.receiptNumber}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Method:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedPayment.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                    {selectedPayment.transactionId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => handleDownloadReceipt(selectedPayment)}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}







