import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#DDA0DD']

export function StudentPerformanceTrendsChart({ data }) {
  // Process performance data for charts
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        performanceLevel: getPerformanceLevel(item.averageScore),
        color: COLORS[index % COLORS.length]
      }))
  }, [data])

  const performanceLevels = useMemo(() => {
    if (!processedData.length) return []
    
    const levels = {
      'Excellent': { count: 0, color: '#10B981' },
      'Good': { count: 0, color: '#3B82F6' },
      'Average': { count: 0, color: '#F59E0B' },
      'Below Average': { count: 0, color: '#EF4444' }
    }
    
    processedData.forEach(item => {
      levels[item.performanceLevel].count++
    })
    
    return Object.entries(levels)
      .map(([name, data]) => ({ name, value: data.count, color: data.color }))
      .filter(item => item.value > 0)
  }, [processedData])

  const getPerformanceLevel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Average'
    return 'Below Average'
  }

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No performance data available for the selected period.
      </div>
    )
  }

  const totalStudents = data.reduce((sum, item) => sum + item.totalStudents, 0)
  const overallAverage = data.reduce((sum, item) => sum + (item.averageScore * item.totalStudents), 0) / totalStudents

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Classes</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Total Students</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStudents}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400">Overall Average</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {overallAverage.toFixed(1)}%
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="text-sm text-orange-600 dark:text-orange-400">Top Performing</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {data[0]?.className || 'N/A'}
          </div>
        </div>
      </div>

      {/* Class Performance Comparison */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Performance Comparison</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="className" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              domain={[0, 100]}
              label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value}%`, 
                name === 'averageScore' ? 'Average Score' : 'Rank'
              ]}
              labelFormatter={(label) => `Class: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="averageScore" 
              fill="#3B82F6" 
              name="Average Score"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Level Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={performanceLevels}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceLevels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Ranking</h4>
          <div className="space-y-3">
            {processedData.slice(0, 8).map((item, index) => (
              <div key={item.className} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{item.className}</span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getPerformanceColor(item.averageScore)}`}>
                    {item.averageScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.totalStudents} students
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Trends Over Time (if historical data available) */}
      {processedData.length > 1 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                labelFormatter={(label) => `Class: ${label}`}
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Performance Table */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Performance Data</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.map((item) => (
                <tr key={item.className} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-bold ${getPerformanceColor(item.averageScore)}`}>
                      {item.averageScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.performanceLevel === 'Excellent' ? 'bg-green-100 text-green-800' :
                      item.performanceLevel === 'Good' ? 'bg-blue-100 text-blue-800' :
                      item.performanceLevel === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.performanceLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
