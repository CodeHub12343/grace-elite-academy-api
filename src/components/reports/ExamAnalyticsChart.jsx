import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function ExamAnalyticsChart({ data, examId }) {
  // Process exam analytics data for charts
  const processedData = useMemo(() => {
    if (!data) return {}
    
    const analytics = data.data || data
    
    // Process score distribution
    const distribution = analytics.distribution || {}
    const distributionData = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / (analytics.count || 1)) * 100).toFixed(1)
    }))
    
    // Process performance metrics
    const metrics = {
      averageScore: analytics.averageScore || 0,
      totalSubmissions: analytics.count || analytics.submissions || 0,
      totalMarks: analytics.totalMarks || 100,
      passRate: analytics.passRate || 0,
      highestScore: analytics.highestScore || 0,
      lowestScore: analytics.lowestScore || 0,
      medianScore: analytics.medianScore || 0
    }
    
    // Process score ranges for analysis
    const scoreRanges = [
      { range: '90-100', label: 'A+ (90-100)', color: '#10B981' },
      { range: '80-89', label: 'A (80-89)', color: '#3B82F6' },
      { range: '70-79', label: 'B (70-79)', color: '#8B5CF6' },
      { range: '60-69', label: 'C (60-69)', color: '#F59E0B' },
      { range: '50-59', label: 'D (50-59)', color: '#EF4444' },
      { range: '0-49', label: 'F (0-49)', color: '#DC2626' }
    ]
    
    return {
      distributionData,
      metrics,
      scoreRanges,
      rawData: analytics
    }
  }, [data])

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No exam analytics data available.
      </div>
    )
  }

  const { distributionData, metrics, scoreRanges, rawData } = processedData

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Average Score</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.averageScore.toFixed(1)}%
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Total Submissions</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.totalSubmissions}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400">Pass Rate</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.passRate}%
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="text-sm text-orange-600 dark:text-orange-400">Total Marks</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {metrics.totalMarks}
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      {distributionData.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                label={{ value: 'Score Range', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'count' ? value : `${value}%`, 
                  name === 'count' ? 'Students' : 'Percentage'
                ]}
                labelFormatter={(label) => `Score Range: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#3B82F6" 
                name="Students"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Range Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Range Analysis</h4>
          <div className="space-y-3">
            {scoreRanges.map((range) => {
              const count = distributionData.find(d => d.range === range.range)?.count || 0
              const percentage = ((count / metrics.totalSubmissions) * 100).toFixed(1)
              
              return (
                <div key={range.range} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: range.color }}
                    ></div>
                    <span className="font-medium text-gray-900 dark:text-white">{range.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{percentage}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">Highest Score</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.highestScore}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-600 dark:text-green-400">Lowest Score</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {metrics.lowestScore}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400">Median Score</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.medianScore}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-orange-600 dark:text-orange-400">Standard Deviation</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {rawData.standardDeviation ? rawData.standardDeviation.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends (if historical data available) */}
      {rawData.trends && rawData.trends.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rawData.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Average Score"
              />
              <Line 
                type="monotone" 
                dataKey="passRate" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                name="Pass Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Question Analysis (if available) */}
      {rawData.questionAnalysis && rawData.questionAnalysis.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Performance Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rawData.questionAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="questionNumber" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                labelFormatter={(label) => `Question ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="correctPercentage" 
                fill="#10B981" 
                name="Correct %"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="averageTime" 
                fill="#3B82F6" 
                name="Avg Time (s)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Statistics Table */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Statistics</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  Total Submissions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {metrics.totalSubmissions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Number of students who took the exam
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  Average Score
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {metrics.averageScore.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Mean score across all submissions
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  Pass Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {metrics.passRate}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Percentage of students who passed
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  Score Range
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {metrics.lowestScore}% - {metrics.highestScore}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Lowest to highest scores achieved
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
