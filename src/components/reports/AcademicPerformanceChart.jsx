import React, { useMemo } from 'react'

export function AcademicPerformanceChart({ data = [] }) {
  // Process real data or fall back to mock data if none provided
  const performanceData = useMemo(() => {
    if (data && data.length > 0) {
      // Process real performance data
      return data.map((item, index) => ({
        month: item.month || item.period || `Period ${index + 1}`,
        average: item.average || item.averageScore || 0,
        highest: item.highest || item.highestScore || 0,
        lowest: item.lowest || item.lowestScore || 0,
        totalStudents: item.totalStudents || item.studentCount || 0
      }))
    }
    
    // Fallback to mock data for demonstration
    return [
      { month: 'Jan', average: 75, highest: 95, lowest: 55, totalStudents: 25 },
      { month: 'Feb', average: 78, highest: 92, lowest: 58, totalStudents: 25 },
      { month: 'Mar', average: 82, highest: 96, lowest: 62, totalStudents: 25 },
      { month: 'Apr', average: 79, highest: 94, lowest: 60, totalStudents: 25 },
      { month: 'May', average: 85, highest: 98, lowest: 65, totalStudents: 25 },
      { month: 'Jun', average: 88, highest: 99, lowest: 68, totalStudents: 25 },
    ]
  }, [data])

  const maxScore = 100
  const chartHeight = 200

  const getYPosition = (score) => {
    return chartHeight - (score / maxScore) * chartHeight
  }

  const getPerformanceTrend = () => {
    if (performanceData.length < 2) return 'stable'
    const firstHalf = performanceData.slice(0, Math.ceil(performanceData.length / 2))
    const secondHalf = performanceData.slice(Math.ceil(performanceData.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.average, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.average, 0) / secondHalf.length
    
    if (secondAvg > firstAvg + 2) return 'improving'
    if (secondAvg < firstAvg - 2) return 'declining'
    return 'stable'
  }

  const trend = getPerformanceTrend()
  const overallAverage = performanceData.reduce((sum, item) => sum + item.average, 0) / performanceData.length

  return (
    <div className="w-full">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {overallAverage.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Overall Average</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.max(...performanceData.map(item => item.highest))}%
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Highest Score</div>
        </div>
        <div className={`text-center p-3 rounded-lg ${
          trend === 'improving' ? 'bg-green-50 dark:bg-green-900/20' :
          trend === 'declining' ? 'bg-red-50 dark:bg-red-900/20' :
          'bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <div className={`text-2xl font-bold ${
            trend === 'improving' ? 'text-green-600 dark:text-green-400' :
            trend === 'declining' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {trend === 'improving' ? '↗' : trend === 'declining' ? '↘' : '→'}
          </div>
          <div className={`text-sm ${
            trend === 'improving' ? 'text-green-600 dark:text-green-400' :
            trend === 'declining' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <div className="relative h-48">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((score) => (
              <div
                key={score}
                className="border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${getYPosition(score)}px` }}
              >
                <span className="absolute -top-2 -left-8 text-xs text-gray-500">
                  {score}%
                </span>
              </div>
            ))}
          </div>

          {/* Chart lines */}
          <svg className="absolute inset-0 w-full h-full">
            {/* Average performance line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={performanceData.map((data, index) => 
                `${(index / (performanceData.length - 1)) * 100}%,${getYPosition(data.average)}`
              ).join(' ')}
            />
            
            {/* Highest score line */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4"
              points={performanceData.map((data, index) => 
                `${(index / (performanceData.length - 1)) * 100}%,${getYPosition(data.highest)}`
              ).join(' ')}
            />
            
            {/* Lowest score line */}
            <polyline
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray="4"
              points={performanceData.map((data, index) => 
                `${(index / (performanceData.length - 1)) * 100}%,${getYPosition(data.lowest)}`
              ).join(' ')}
            />

            {/* Data points */}
            {performanceData.map((data, index) => (
              <g key={index}>
                <circle
                  cx={`${(index / (performanceData.length - 1)) * 100}%`}
                  cy={getYPosition(data.average)}
                  r="4"
                  fill="#3B82F6"
                />
                <circle
                  cx={`${(index / (performanceData.length - 1)) * 100}%`}
                  cy={getYPosition(data.highest)}
                  r="3"
                  fill="#10B981"
                />
                <circle
                  cx={`${(index / (performanceData.length - 1)) * 100}%`}
                  cy={getYPosition(data.lowest)}
                  r="3"
                  fill="#EF4444"
                />
              </g>
            ))}
          </svg>

          {/* Month labels */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between">
            {performanceData.map((data, index) => (
              <div key={index} className="text-xs text-gray-500 text-center">
                {data.month}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-8">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Average</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Highest</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Lowest</span>
          </div>
        </div>
      </div>

      {/* Performance Details Table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Performance Details</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Period</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Average</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Highest</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Lowest</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400">Students</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-900 dark:text-white">{item.month}</td>
                  <td className="py-2 text-blue-600 dark:text-blue-400 font-medium">{item.average}%</td>
                  <td className="py-2 text-green-600 dark:text-green-400 font-medium">{item.highest}%</td>
                  <td className="py-2 text-red-600 dark:text-red-400 font-medium">{item.lowest}%</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{item.totalStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}




















