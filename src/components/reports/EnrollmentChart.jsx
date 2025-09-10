import React from 'react'

export function EnrollmentChart() {
  // Mock data - in a real app, this would come from the API
  const enrollmentData = [
    { month: 'Jan', enrolled: 120, total: 150 },
    { month: 'Feb', enrolled: 135, total: 150 },
    { month: 'Mar', enrolled: 142, total: 150 },
    { month: 'Apr', enrolled: 148, total: 150 },
    { month: 'May', enrolled: 150, total: 150 },
    { month: 'Jun', enrolled: 145, total: 150 },
  ]

  const maxValue = Math.max(...enrollmentData.map(d => d.total))

  return (
    <div className="w-full h-64">
      <div className="flex items-end justify-between h-48 space-x-2">
        {enrollmentData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            {/* Enrolled students bar */}
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{
                height: `${(data.enrolled / maxValue) * 100}%`,
                minHeight: '4px'
              }}
            />
            {/* Total capacity bar */}
            <div
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-t"
              style={{
                height: `${(data.total / maxValue) * 100}%`,
                minHeight: '4px'
              }}
            />
            {/* Month label */}
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {data.month}
            </span>
            {/* Value labels */}
            <div className="text-center mt-1">
              <div className="text-xs font-medium text-blue-600">
                {data.enrolled}
              </div>
              <div className="text-xs text-gray-500">
                / {data.total}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Enrolled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Capacity</span>
        </div>
      </div>
    </div>
  )
}

























