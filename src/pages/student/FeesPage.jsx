import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { feesApi, paymentsApi, studentsApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import notificationService from '../../services/notificationService'

export function StudentFeesPage() {
  useAuth() // ensure auth hook runs; user shape not needed here due to scope=mine
  // Resolve the Student document id via scope=mine (backend expects Student._id)
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['students', 'me'],
    queryFn: () => studentsApi.getStudents({ scope: 'mine' }),
  })
  const studentId = Array.isArray(meData?.data)
    ? meData?.data?.[0]?._id
    : Array.isArray(meData)
      ? meData?.[0]?._id
      : meData?.student?._id || meData?._id
  useQueryClient() // placeholder to keep client warm; not directly used here
  const [searchParams, setSearchParams] = useSearchParams()
  // no local receipt handling; rely on webhook and polling
  const [processingRef, setProcessingRef] = useState(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['fees', 'student', studentId],
    queryFn: () => feesApi.forStudent(studentId),
    enabled: !!studentId,
  })

  const fees = useMemo(() => data?.data || data?.fees || data || [], [data])

  // Calculate summary totals
  const summary = useMemo(() => {
    const totalAmount = fees.reduce((sum, f) => sum + (f?.amount || 0), 0)
    const totalPaid = fees.reduce((sum, f) => sum + (f?.amountPaid || 0), 0)
    const totalLateFee = fees.reduce((sum, f) => sum + (f?.dynamicLateFee || 0), 0)
    const totalBalance = fees.reduce((sum, f) => {
      const amount = f?.amount || 0
      const paid = f?.amountPaid || 0
      const late = f?.dynamicLateFee || 0
      return sum + Math.max(0, amount + late - paid)
    }, 0)
    const paidCount = fees.filter(f => {
      const amount = f?.amount || 0
      const paid = f?.amountPaid || 0
      const late = f?.dynamicLateFee || 0
      return (amount + late - paid) <= 0
    }).length
    const pendingCount = fees.length - paidCount

    return {
      totalAmount,
      totalPaid,
      totalLateFee,
      totalBalance,
      paidCount,
      pendingCount,
      totalCount: fees.length
    }
  }, [fees])

  const initiateMutation = useMutation({
    mutationFn: ({ feeId, amount }) => paymentsApi.initiate({ studentId, feeId, amount }),
    onSuccess: (res) => {
      const url = res?.data?.authorization_url || res?.authorization_url
      if (url) {
        window.location.href = url
      }
    },
  })

  // Socket listener for payment success
  useEffect(() => {
    const unsubscribe = notificationService.on('payment:success', (data) => {
      console.log('Payment success received:', data)
      refetch() // Auto-refresh fees on payment success
    })

    return unsubscribe
  }, [refetch])

  // Handle payment reference from URL
  useEffect(() => {
    const ref = searchParams.get('reference')
    if (ref) {
      setProcessingRef(ref)
      // Poll fees for a short period for webhook to land
      let attempts = 0
      const interval = setInterval(() => {
        attempts += 1
        refetch()
        if (attempts >= 5) clearInterval(interval)
      }, 2000)
      searchParams.delete('reference')
      setSearchParams(searchParams, { replace: true })
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-lg sm:text-xl font-semibold">My Fees & Invoices</div>
        <Button onClick={() => refetch()} disabled={isFetching} className="w-full sm:w-auto">
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      {fees?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Due</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">₦{summary.totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Paid</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">₦{summary.totalPaid.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Late Fees</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">₦{summary.totalLateFee.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Outstanding</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">₦{summary.totalBalance.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      {fees?.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {summary.paidCount} Paid ({summary.totalCount > 0 ? Math.round((summary.paidCount / summary.totalCount) * 100) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {summary.pendingCount} Pending ({summary.totalCount > 0 ? Math.round((summary.pendingCount / summary.totalCount) * 100) : 0}%)
            </span>
          </div>
        </div>
      )}

      {/* Loading */}
      {meLoading || isLoading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
      ) : fees?.length ? (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {fees.map((f) => {
              const title = f?.title || f?.name || f?.feeCategoryId?.name || 'Fee'
              const due = f?.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'
              const amount = f?.amount ?? 0
              const paid = f?.amountPaid ?? 0
              const late = f?.dynamicLateFee ?? 0
              const balance = f?.currentBalance ?? Math.max(0, amount + late - paid)
              const status = f?.status || (balance <= 0 ? 'paid' : 'pending')
              return (
                <div key={f._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Due: {due}</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>Amount: ₦{amount.toLocaleString()}</div>
                        <div>Paid: ₦{paid.toLocaleString()}</div>
                        <div>Late: ₦{late.toLocaleString()}</div>
                        <div className="font-medium">Balance: ₦{balance.toLocaleString()}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'paid' || balance <= 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {status === 'paid' || balance <= 0 ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    {status === 'paid' || balance <= 0 ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <span>✓</span>
                        <span>Fully Paid</span>
                      </div>
                    ) : (
                      <PayCell fee={f} balance={balance} loading={initiateMutation.isPending} onPay={(amt) => initiateMutation.mutate({ feeId: f._id, amount: amt })} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="text-left px-4 py-2">Fee</th>
                  <th className="text-left px-4 py-2">Due Date</th>
                  <th className="text-left px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Paid</th>
                  <th className="text-left px-4 py-2">Late Fee</th>
                  <th className="text-left px-4 py-2">Balance</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Pay</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => {
                  const title = f?.title || f?.name || f?.feeCategoryId?.name || 'Fee'
                  const due = f?.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'
                  const amount = f?.amount ?? 0
                  const paid = f?.amountPaid ?? 0
                  const late = f?.dynamicLateFee ?? 0
                  const balance = f?.currentBalance ?? Math.max(0, amount + late - paid)
                  const status = f?.status || (balance <= 0 ? 'paid' : 'pending')
                  return (
                    <tr key={f._id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2">{title}</td>
                      <td className="px-4 py-2">{due}</td>
                      <td className="px-4 py-2">₦{amount.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{paid.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{late.toLocaleString()}</td>
                      <td className="px-4 py-2 font-medium">₦{balance.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'paid' || balance <= 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {status === 'paid' || balance <= 0 ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {status === 'paid' || balance <= 0 ? (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <span>✓</span>
                            <span>Fully Paid</span>
                          </div>
                        ) : (
                          <PayCell fee={f} balance={balance} loading={initiateMutation.isPending} onPay={(amt) => initiateMutation.mutate({ feeId: f._id, amount: amt })} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-600 dark:text-gray-400">No fees found.</div>
      )}

      {processingRef && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <div className="font-medium">Processing payment...</div>
              <div className="text-sm">Reference: {processingRef}</div>
              <div className="text-sm">We will update your balances shortly.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PayCell({ balance, loading, onPay }) {
  const [amount, setAmount] = useState(() => balance)
  const disabled = loading || !amount || amount <= 0 || amount > balance
  
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="relative flex-1 sm:flex-none sm:w-32">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₦</span>
        <input
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          type="number"
          min={1}
          max={balance}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount"
        />
      </div>
      <Button 
        size="sm" 
        onClick={() => onPay(amount)} 
        disabled={disabled} 
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processing...</span>
          </div>
        ) : (
          'Pay Now'
        )}
      </Button>
    </div>
  )
}







