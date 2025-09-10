import React from 'react'

export function AttendanceTrendsChart() {
  // Mock data - in a real app, this would come from the API
  const attendanceData = [
    { week: 'Week 1', present: 92, absent: 8, late: 5 },
    { week: 'Week 2', present: 89, absent: 11, late: 7 },
    { week: 'Week 3', present: 94, absent: 6, late: 3 },
    { week: 'Week 4', present: 91, absent: 9, late: 6 },
    { week: 'Week 5', present: 96, absent: 4, late: 2 },
    { week: 'Week 6', present: 93, absent: 7, late: 4 },
  ]

  const maxAttendance = Math.max(...attendanceData.map(d => d.present))
  const chartHeight = 200

  const getYPosition = (value) => {
    return chartHeight - (value / maxAttendance) * chartHeight
  }

  return (
    <div className="w-full h-64">
      <div className="relative h-48">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="border-t border-gray-200 dark:border-gray-700"
              style={{ top: `${getYPosition((percent / 100) * maxAttendance)}px` }}
            >
              <span className="absolute -top-2 -left-8 text-xs text-gray-500">
                {percent}%
              </span>
            </div>
          ))}
        </div>

        {/* Chart lines */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Present attendance line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            points={attendanceData.map((data, index) => 
              `${(index / (attendanceData.length - 1)) * 100}%,${getYPosition(data.present)}`
            ).join(' ')}
          />
          
          {/* Absent attendance line */}
          <polyline
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="4"
            points={attendanceData.map((data, index) => 
              `${(index / (attendanceData.length - 1)) * 100}%,${getYPosition(data.absent)}`
            ).join(' ')}
          />
          
          {/* Late attendance line */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="4"
            points={attendanceData.map((data, index) => 
              `${(index / (attendanceData.length - 1)) * 100}%,${getYPosition(data.late)}`
            ).join(' ')}
          />

          {/* Data points */}
          {attendanceData.map((data, index) => (
            <g key={index}>
              <circle
                cx={`${(index / (attendanceData.length - 1)) * 100}%`}
                cy={getYPosition(data.present)}
                r="4"
                fill="#10B981"
              />
              <circle
                cx={`${(index / (attendanceData.length - 1)) * 100}%`}
                cy={getYPosition(data.absent)}
                r="3"
                fill="#EF4444"
              />
              <circle
                cx={`${(index / (attendanceData.length - 1)) * 100}%`}
                cy={getYPosition(data.late)}
                r="3"
                fill="#F59E0B"
              />
            </g>
          ))}
        </svg>

        {/* Week labels */}
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between">
          {attendanceData.map((data, index) => (
            <span
              key={index}
              className="text-xs text-gray-600 dark:text-gray-400"
              style={{ left: `${(index / (attendanceData.length - 1)) * 100}%` }}
            >
              {data.week}
            </span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-8">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Late</span>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Average Attendance: <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(attendanceData.reduce((sum, d) => sum + d.present, 0) / attendanceData.length)}%
          </span>
        </div>
      </div>
    </div>
  )
}

























