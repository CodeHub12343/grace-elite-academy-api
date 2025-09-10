import { useState, useEffect } from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { 
  Calculator, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Calendar,
  Info,
  Settings,
  RefreshCw
} from 'lucide-react'

export function LateFeeCalculator({ 
  dueDate, 
  amount, 
  onCalculate, 
  onApply,
  showSettings = true,
  readOnly = false 
}) {
  const [settings, setSettings] = useState({
    gracePeriod: 7, // days after due date
    dailyRate: 0.5, // percentage per day
    maxLateFee: 25, // maximum percentage of original amount
    flatFee: 0, // flat fee amount
    compoundInterest: false, // whether to compound daily
    weekendHolidayExemption: true // exclude weekends and holidays
  })
  
  const [calculatedFees, setCalculatedFees] = useState({
    daysLate: 0,
    dailyFee: 0,
    totalLateFee: 0,
    flatFee: 0,
    grandTotal: 0,
    breakdown: []
  })
  
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate late fees when due date, amount, or settings change
  useEffect(() => {
    if (dueDate && amount) {
      calculateLateFees()
    }
  }, [dueDate, amount, settings])

  const calculateLateFees = () => {
    if (!dueDate || !amount) return

    setIsCalculating(true)
    
    try {
      const today = new Date()
      const due = new Date(dueDate)
      const timeDiff = today.getTime() - due.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff <= settings.gracePeriod) {
        // Within grace period, no late fees
        setCalculatedFees({
          daysLate: 0,
          dailyFee: 0,
          totalLateFee: 0,
          flatFee: settings.flatFee,
          grandTotal: parseFloat(amount) + settings.flatFee,
          breakdown: []
        })
        return
      }

      const daysLate = daysDiff - settings.gracePeriod
      let totalLateFee = 0
      const breakdown = []

      if (settings.compoundInterest) {
        // Compound interest calculation
        let runningAmount = parseFloat(amount)
        for (let day = 1; day <= daysLate; day++) {
          if (settings.weekendHolidayExemption && isWeekendOrHoliday(due, day)) {
            continue
          }
          
          const dailyFee = (runningAmount * settings.dailyRate) / 100
          totalLateFee += dailyFee
          runningAmount += dailyFee
          
          breakdown.push({
            day: day,
            amount: runningAmount,
            dailyFee: dailyFee,
            cumulativeFee: totalLateFee
          })
        }
      } else {
        // Simple interest calculation
        let effectiveDays = daysLate
        
        if (settings.weekendHolidayExemption) {
          effectiveDays = countBusinessDays(due, daysLate)
        }
        
        totalLateFee = (parseFloat(amount) * settings.dailyRate * effectiveDays) / 100
        totalLateFee += settings.flatFee
        
        breakdown.push({
          daysLate: effectiveDays,
          dailyRate: settings.dailyRate,
          calculatedFee: totalLateFee - settings.flatFee,
          flatFee: settings.flatFee
        })
      }

      // Apply maximum late fee cap
      const maxFee = (parseFloat(amount) * settings.maxLateFee) / 100
      if (totalLateFee > maxFee) {
        totalLateFee = maxFee
      }

      const grandTotal = parseFloat(amount) + totalLateFee

      setCalculatedFees({
        daysLate: daysLate,
        dailyFee: (parseFloat(amount) * settings.dailyRate) / 100,
        totalLateFee: totalLateFee,
        flatFee: settings.flatFee,
        grandTotal: grandTotal,
        breakdown: breakdown
      })

      // Call onCalculate callback
      if (onCalculate) {
        onCalculate({
          daysLate,
          totalLateFee,
          grandTotal,
          breakdown
        })
      }
    } catch (error) {
      console.error('Error calculating late fees:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const isWeekendOrHoliday = (baseDate, dayOffset) => {
    const checkDate = new Date(baseDate)
    checkDate.setDate(checkDate.getDate() + dayOffset)
    
    const dayOfWeek = checkDate.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
  }

  const countBusinessDays = (baseDate, totalDays) => {
    let businessDays = 0
    for (let day = 1; day <= totalDays; day++) {
      if (!isWeekendOrHoliday(baseDate, day)) {
        businessDays++
      }
    }
    return businessDays
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysLateColor = (days) => {
    if (days === 0) return 'text-green-600'
    if (days <= 7) return 'text-yellow-600'
    if (days <= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getLateFeeColor = (fee, originalAmount) => {
    const percentage = (fee / originalAmount) * 100
    if (percentage <= 5) return 'text-green-600'
    if (percentage <= 15) return 'text-yellow-600'
    if (percentage <= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleApplyLateFees = () => {
    if (onApply) {
      onApply(calculatedFees)
    }
  }

  const resetCalculation = () => {
    setCalculatedFees({
      daysLate: 0,
      dailyFee: 0,
      totalLateFee: 0,
      flatFee: 0,
      grandTotal: 0,
      breakdown: []
    })
  }

  const renderSettingsModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showSettingsModal ? 'block' : 'hidden'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Late Fee Settings</h3>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grace Period (days)
            </label>
            <input
              type="number"
              value={settings.gracePeriod}
              onChange={(e) => setSettings(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              max="30"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Rate (%)
            </label>
            <input
              type="number"
              value={settings.dailyRate}
              onChange={(e) => setSettings(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              max="10"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Late Fee (%)
            </label>
            <input
              type="number"
              value={settings.maxLateFee}
              onChange={(e) => setSettings(prev => ({ ...prev, maxLateFee: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Flat Fee Amount
            </label>
            <input
              type="number"
              value={settings.flatFee}
              onChange={(e) => setSettings(prev => ({ ...prev, flatFee: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="compoundInterest"
              checked={settings.compoundInterest}
              onChange={(e) => setSettings(prev => ({ ...prev, compoundInterest: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="compoundInterest" className="text-sm text-gray-700 dark:text-gray-300">
              Compound Interest (daily)
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="weekendHolidayExemption"
              checked={settings.weekendHolidayExemption}
              onChange={(e) => setSettings(prev => ({ ...prev, weekendHolidayExemption: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="weekendHolidayExemption" className="text-sm text-gray-700 dark:text-gray-300">
              Exclude weekends & holidays
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowSettingsModal(false)}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )

  if (!dueDate || !amount) {
    return (
      <Card className="p-6 text-center">
        <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Please provide due date and amount to calculate late fees</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Late Fee Calculator</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Due: {formatDate(dueDate)} | Amount: {formatCurrency(amount)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetCalculation}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Calculation Results */}
      <Card className="p-6">
        {isCalculating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Calculating late fees...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculatedFees.daysLate}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Days Late</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(calculatedFees.dailyFee)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Daily Fee</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(calculatedFees.totalLateFee)}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Total Late Fee</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(calculatedFees.grandTotal)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Grand Total</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {calculatedFees.breakdown.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Calculation Breakdown</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {calculatedFees.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.day ? `Day ${item.day}` : `${item.daysLate} days`}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.dailyFee ? formatCurrency(item.dailyFee) : formatCurrency(item.calculatedFee)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings and Notes */}
            {calculatedFees.daysLate > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Late Payment Detected</p>
                    <p>
                      This payment is {calculatedFees.daysLate} days overdue. 
                      Late fees have been calculated based on your current settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!readOnly && calculatedFees.totalLateFee > 0 && (
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={resetCalculation}>
                  Cancel
                </Button>
                <Button onClick={handleApplyLateFees}>
                  Apply Late Fees
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Settings Modal */}
      {renderSettingsModal()}
    </div>
  )
}













