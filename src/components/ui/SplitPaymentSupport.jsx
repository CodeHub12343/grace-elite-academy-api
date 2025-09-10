import { useState, useEffect } from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { Modal } from './Modal'
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  Split, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Calculator,
  Info,
  Trash2
} from 'lucide-react'

export function SplitPaymentSupport({ 
  totalAmount, 
  onSplitComplete, 
  onCancel,
  showModal = false,
  onClose 
}) {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, method: 'card', amount: 0, description: 'Credit/Debit Card' }
  ])
  
  const [nextId, setNextId] = useState(2)
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate totals
  const totalAllocated = paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0)
  const remaining = totalAmount - totalAllocated
  const isComplete = remaining <= 0.01 // Allow for small rounding differences

  // Payment method options
  const availableMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-600' },
    { value: 'bank', label: 'Bank Transfer', icon: Banknote, color: 'text-green-600' },
    { value: 'cash', label: 'Cash Payment', icon: Wallet, color: 'text-yellow-600' },
    { value: 'mobile', label: 'Mobile Money', icon: Wallet, color: 'text-purple-600' },
    { value: 'check', label: 'Check', icon: Banknote, color: 'text-gray-600' }
  ]

  const addPaymentMethod = () => {
    const newMethod = {
      id: nextId,
      method: 'card',
      amount: 0,
      description: 'Credit/Debit Card'
    }
    setPaymentMethods(prev => [...prev, newMethod])
    setNextId(prev => prev + 1)
  }

  const removePaymentMethod = (id) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(prev => prev.filter(method => method.id !== id))
    }
  }

  const updatePaymentMethod = (id, field, value) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    )
    
    // Clear errors when updating
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const validatePaymentMethods = () => {
    const newErrors = {}
    
    paymentMethods.forEach(method => {
      if (!method.amount || method.amount <= 0) {
        newErrors[method.id] = 'Amount must be greater than 0'
      } else if (method.amount > totalAmount) {
        newErrors[method.id] = 'Amount cannot exceed total'
      }
    })
    
    if (totalAllocated > totalAmount) {
      newErrors.total = 'Total allocated amount cannot exceed total amount'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProcessSplitPayment = async () => {
    if (!validatePaymentMethods()) {
      return
    }

    setIsProcessing(true)
    
    try {
      // Simulate processing each payment method
      const processedPayments = []
      
      for (const method of paymentMethods) {
        if (method.amount > 0) {
          // Here you would integrate with actual payment processors
          const paymentResult = await processPaymentMethod(method)
          processedPayments.push(paymentResult)
        }
      }
      
      // Call success callback
      if (onSplitComplete) {
        onSplitComplete({
          totalAmount,
          payments: processedPayments,
          splitDetails: paymentMethods
        })
      }
      
    } catch (error) {
      console.error('Split payment processing failed:', error)
      setErrors({ general: 'Failed to process split payment. Please try again.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const processPaymentMethod = async (method) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      id: method.id,
      method: method.method,
      amount: method.amount,
      status: 'success',
      transactionId: `TXN_${Date.now()}_${method.id}`,
      timestamp: new Date().toISOString()
    }
  }

  const autoDistributeRemaining = () => {
    if (remaining <= 0) return
    
    // Find the first method with 0 amount or distribute proportionally
    const zeroAmountMethods = paymentMethods.filter(m => m.amount === 0)
    
    if (zeroAmountMethods.length > 0) {
      // Add remaining to first zero amount method
      updatePaymentMethod(zeroAmountMethods[0].id, 'amount', remaining)
    } else {
      // Distribute proportionally among all methods
      const totalAllocated = paymentMethods.reduce((sum, m) => sum + m.amount, 0)
      const distribution = paymentMethods.map(method => ({
        ...method,
        newAmount: method.amount + (remaining * (method.amount / totalAllocated))
      }))
      
      distribution.forEach(item => {
        updatePaymentMethod(item.id, 'amount', Math.round(item.newAmount * 100) / 100)
      })
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getMethodIcon = (methodType) => {
    const method = availableMethods.find(m => m.value === methodType)
    if (method) {
      const Icon = method.icon
      return <Icon className={`h-5 w-5 ${method.color}`} />
    }
    return <CreditCard className="h-5 w-5 text-gray-400" />
  }

  const getMethodLabel = (methodType) => {
    const method = availableMethods.find(m => m.value === methodType)
    return method ? method.label : 'Unknown Method'
  }

  const renderPaymentMethod = (method) => (
    <Card key={method.id} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getMethodIcon(method.method)}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {getMethodLabel(method.method)}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment Method #{method.id}
            </p>
          </div>
        </div>
        
        {paymentMethods.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => removePaymentMethod(method.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method
          </label>
          <select
            value={method.method}
            onChange={(e) => updatePaymentMethod(method.id, 'method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {availableMethods.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              ₦
            </span>
            <input
              type="number"
              value={method.amount || ''}
              onChange={(e) => updatePaymentMethod(method.id, 'amount', parseFloat(e.target.value) || 0)}
              className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors[method.id] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
              min="0"
              max={totalAmount}
              step="0.01"
            />
          </div>
          {errors[method.id] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[method.id]}</p>
          )}
        </div>
      </div>
      
      {method.amount > 0 && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(method.amount)}
            </span>
          </div>
        </div>
      )}
    </Card>
  )

  const renderSummary = () => (
    <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center">
        <Calculator className="h-5 w-5 mr-2" />
        Payment Summary
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Amount</div>
        </div>
        
        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className={`text-2xl font-bold ${
            totalAllocated > totalAmount ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(totalAllocated)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Allocated</div>
        </div>
        
        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className={`text-2xl font-bold ${
            remaining > 0.01 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(remaining))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {remaining > 0.01 ? 'Remaining' : 'Complete'}
          </div>
        </div>
      </div>
      
      {remaining > 0.01 && (
        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200">
              {formatCurrency(remaining)} remaining to allocate
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={autoDistributeRemaining}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-600 dark:hover:bg-yellow-900/30"
          >
            Auto-Distribute
          </Button>
        </div>
      )}
      
      {errors.total && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{errors.total}</p>
        </div>
      )}
      
      {errors.general && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{errors.general}</p>
        </div>
      )}
    </Card>
  )

  const renderActions = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          onClick={addPaymentMethod}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Payment Method</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center space-x-2"
        >
          Cancel
        </Button>
      </div>
      
      <Button
        onClick={handleProcessSplitPayment}
        disabled={!isComplete || isProcessing}
        className="flex items-center space-x-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Split className="h-4 w-4" />
            <span>Process Split Payment</span>
          </>
        )}
      </Button>
    </div>
  )

  if (showModal) {
    return (
      <Modal
        isOpen={showModal}
        onClose={onClose}
        title="Split Payment"
        size="xl"
      >
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Split Payment</p>
                <p>
                  You can split your payment across multiple payment methods. 
                  Each method will be processed separately and you'll receive individual receipts.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            {paymentMethods.map(renderPaymentMethod)}
          </div>

          {/* Summary */}
          {renderSummary()}

          {/* Actions */}
          {renderActions()}
        </div>
      </Modal>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Split className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Split Payment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Split your payment across multiple methods
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.map(renderPaymentMethod)}
      </div>

      {/* Summary */}
      {renderSummary()}

      {/* Actions */}
      {renderActions()}
    </div>
  )
}













