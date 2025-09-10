import React from 'react'

export function SubjectDistributionChart({ data = [] }) {
  // Use provided data or fallback to mock data
  const subjectData = data.length > 0 ? data.map((subject, index) => ({
    ...subject,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]
  })) : [
    { name: 'Mathematics', students: 180, color: '#3B82F6' },
    { name: 'Science', students: 165, color: '#10B981' },
    { name: 'English', students: 150, color: '#F59E0B' },
    { name: 'History', students: 120, color: '#EF4444' },
    { name: 'Geography', students: 95, color: '#8B5CF6' },
    { name: 'Literature', students: 85, color: '#EC4899' },
  ]

  const totalStudents = subjectData.reduce((sum, subject) => sum + subject.students, 0)

  // Calculate angles for pie chart
  let currentAngle = 0
  const segments = subjectData.map(subject => {
    const percentage = (subject.students / totalStudents) * 100
    const startAngle = currentAngle
    const endAngle = currentAngle + (percentage / 100) * 360
    currentAngle = endAngle
    
    return {
      ...subject,
      percentage,
      startAngle,
      endAngle,
    }
  })

  const radius = 80
  const centerX = 100
  const centerY = 100

  const getArcPath = (startAngle, endAngle) => {
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="w-full h-64">
      <div className="flex items-center justify-center">
        {/* Pie Chart */}
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={getArcPath(segment.startAngle, segment.endAngle)}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {totalStudents}
              </div>
              <div className="text-xs text-gray-500">Total Students</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {segment.name}
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white ml-auto">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Most Popular: <span className="font-medium text-gray-900 dark:text-white">
            {subjectData[0]?.name}
          </span> ({subjectData[0]?.students} students)
        </div>
      </div>
    </div>
  )
}
