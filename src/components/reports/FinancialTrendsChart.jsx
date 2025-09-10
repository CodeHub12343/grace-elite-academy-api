import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function FinancialTrendsChart({ data, selectedPeriod }) {
  const { categories, invoices, payments } = data || {}

  // Process financial data for charts
  const processedData = useMemo(() => {
    if (!invoices || !payments) return []

    // Group by month/period
    const monthlyData = {}
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt || invoice.dueDate)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          paymentCount: 0
        }
      }
      
      monthlyData[monthKey].totalInvoiced += invoice.amount || 0
      monthlyData[monthKey].totalOutstanding += (invoice.amount || 0) - (invoice.paidAmount || 0)
    })

    payments.forEach(payment => {
      const date = new Date(payment.createdAt || payment.paidAt)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          paymentCount: 0
        }
      }
      
      monthlyData[monthKey].totalPaid += payment.amount || 0
      monthlyData[monthKey].paymentCount += 1
    })

    return Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month))
  }, [invoices, payments])

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    if (!categories || !invoices) return []
    
    const categoryTotals = {}
    categories.forEach(cat => {
      categoryTotals[cat.name] = 0
    })
    
    invoices.forEach(invoice => {
      const categoryName = invoice.category?.name || 'Uncategorized'
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (invoice.amount || 0)
    })
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [categories, invoices])

  // Payment status summary
  const paymentSummary = useMemo(() => {
    if (!invoices) return []
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
    const totalOutstanding = totalInvoiced - totalPaid
    
    return [
      { name: 'Paid', value: totalPaid, color: '#10B981' },
      { name: 'Outstanding', value: totalOutstanding, color: '#EF4444' },
      { name: 'Overdue', value: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0), color: '#F59E0B' }
    ].filter(item => item.value > 0)
  }, [invoices])

  if (!data || (!invoices && !payments)) {
    return (
      <div className="text-center py-8 text-gray-500">
        No financial data available for the selected period.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Invoiced</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₦{invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Total Collected</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₦{payments?.reduce((sum, pay) => sum + (pay.amount || 0), 0).toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400">Outstanding</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            ₦{(invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) - payments?.reduce((sum, pay) => sum + (pay.amount || 0), 0)).toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400">Payment Rate</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {invoices?.length > 0 ? Math.round((payments?.length / invoices.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Revenue Trends Chart */}
      {processedData.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `₦${value.toLocaleString()}`, 
                  name === 'totalInvoiced' ? 'Invoiced' : 
                  name === 'totalPaid' ? 'Paid' : 'Outstanding'
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="totalInvoiced" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Invoiced"
              />
              <Area 
                type="monotone" 
                dataKey="totalPaid" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Paid"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Status Distribution */}
      {paymentSummary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Category</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Payment Activity */}
      {payments && payments.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Activity</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'paymentCount' ? value : `₦${value.toLocaleString()}`, 
                name === 'paymentCount' ? 'Payment Count' : 'Amount'
              ]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="paymentCount" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Payment Count"
              />
              <Line 
                type="monotone" 
                dataKey="totalPaid" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Amount Paid"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
