import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Card } from './Card'
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Receipt,
  Calendar,
  DollarSign
} from 'lucide-react'
import { paymentsApi } from '../../lib/api'

export function PaystackPaymentModal({ 
  isOpen, 
  onClose, 
  paymentData, 
  onSuccess, 
  onError 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, processing, success, failed
  const [error, setError] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [paymentDetails, setPaymentDetails] = useState(null)

  // Payment form state
  const [formData, setFormData] = useState({
    email: '',
    amount: '',
    currency: 'NGN',
    reference: '',
    callback_url: '',
    metadata: {}
  })

  // Initialize form data when payment data changes
  useEffect(() => {
    if (paymentData) {
      setFormData({
        email: paymentData.email || '',
        amount: paymentData.amount || '',
        currency: paymentData.currency || 'NGN',
        reference: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback_url: `${window.location.origin}/payment/callback`,
        metadata: {
          studentId: paymentData.studentId,
          feeId: paymentData.feeId,
          feeType: paymentData.feeType,
          academicYear: paymentData.academicYear,
          term: paymentData.term
        }
      })
    }
  }, [paymentData])

  // Initialize Paystack
  useEffect(() => {
    if (isOpen && window.PaystackPop) {
      // Paystack is already loaded
      return
    }

    // Load Paystack script if not already loaded
    if (!window.PaystackPop) {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        console.log('Paystack script loaded')
      }
      script.onerror = () => {
        setError('Failed to load payment system. Please refresh and try again.')
      }
      document.head.appendChild(script)
    }
  }, [isOpen])

  const handlePayment = async () => {
    if (!formData.email || !formData.amount) {
      setError('Please fill in all required fields')
      return
    }

    if (!window.PaystackPop) {
      setError('Payment system not loaded. Please try again.')
      return
    }

    setIsLoading(true)
    setError('')
    setPaymentStatus('processing')

    try {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: formData.email,
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to kobo
        currency: formData.currency,
        ref: formData.reference,
        callback: (response) => {
          handlePaymentSuccess(response)
        },
        onClose: () => {
          handlePaymentClose()
        },
        metadata: formData.metadata
      })

      handler.openIframe()
    } catch (err) {
      console.error('Payment setup error:', err)
      setError('Failed to initialize payment. Please try again.')
      setPaymentStatus('failed')
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async (response) => {
    try {
      setTransactionRef(response.reference)
      setPaymentStatus('success')
      
      // Verify payment with backend (GET /payments/verify/:reference)
      const result = await paymentsApi.verify(response.reference)
      setPaymentDetails(result?.data || result)

      // Call success callback
      if (onSuccess) {
        onSuccess(result?.data || result)
      }
    } catch (err) {
      console.error('Payment verification error:', err)
      setError('Payment completed but verification failed. Please contact support.')
      setPaymentStatus('failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentClose = () => {
    if (paymentStatus === 'pending') {
      setPaymentStatus('failed')
      setError('Payment was cancelled')
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setPaymentStatus('pending')
    setError('')
    setTransactionRef('')
    setPaymentDetails(null)
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: formData.currency
    }).format(amount)
  }

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Payment Summary</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {paymentData?.feeType} - {paymentData?.academicYear} {paymentData?.term}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatAmount(paymentData?.amount || 0)}
            </p>
            {paymentData?.lateFee > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                +{formatAmount(paymentData.lateFee)} late fee
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {formData.currency === 'NGN' ? '₦' : '$'}
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="NGN">Nigerian Naira (₦)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
          </select>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Shield className="h-5 w-5 text-green-600 mt-0.5" />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Secure Payment</p>
          <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          disabled={isLoading || !formData.email || !formData.amount}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Pay {formatAmount(paymentData?.amount || 0)}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Processing Payment
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Please complete your payment in the popup window. Do not close this page.
      </p>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Payment Successful!
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your payment has been processed successfully. Transaction reference: {transactionRef}
      </p>

      {paymentDetails && (
        <Card className="p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium">{formatAmount(paymentDetails.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
              <span className="font-medium">{paymentDetails.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium">
                {new Date(paymentDetails.paidAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-center space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            if (paymentDetails?.receiptUrl) {
              window.open(paymentDetails.receiptUrl, '_blank')
            }
          }}
          className="flex items-center space-x-2"
        >
          <Receipt className="h-4 w-4" />
          <span>Download Receipt</span>
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Payment Failed
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error || 'An error occurred while processing your payment. Please try again.'}
      </p>

      <div className="flex justify-center space-x-3">
        <Button variant="outline" onClick={handleRetry}>
          Try Again
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (paymentStatus) {
      case 'processing':
        return renderProcessing()
      case 'success':
        return renderSuccess()
      case 'failed':
        return renderError()
      default:
        return renderPaymentForm()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        paymentStatus === 'success' ? 'Payment Successful' :
        paymentStatus === 'failed' ? 'Payment Failed' :
        paymentStatus === 'processing' ? 'Processing Payment' :
        'Complete Payment'
      }
      size="md"
    >
      {renderContent()}
    </Modal>
  )
}






