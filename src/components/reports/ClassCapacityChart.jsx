import React from 'react'

export function ClassCapacityChart({ data = [] }) {
  // Use provided data or fallback to mock data
  const classData = data.length > 0 ? data : [
    { name: 'Class 10A', capacity: 35, enrolled: 32, utilization: 91 },
    { name: 'Class 10B', capacity: 35, enrolled: 35, utilization: 100 },
    { name: 'Class 9A', capacity: 30, enrolled: 28, utilization: 93 },
    { name: 'Class 9B', capacity: 30, enrolled: 25, utilization: 83 },
    { name: 'Class 8A', capacity: 32, enrolled: 30, utilization: 94 },
    { name: 'Class 8B', capacity: 32, enrolled: 29, utilization: 91 },
  ]

  return (
    <div className="w-full h-64">
      <div className="space-y-3">
        {classData.map((cls, index) => (
          <div key={index} className="space-y-2">
            {/* Class name and utilization percentage */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {cls.name}
              </span>
              <span className={`font-medium ${
                cls.utilization >= 90 ? 'text-green-600' :
                cls.utilization >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {cls.utilization}%
              </span>
            </div>
            
            {/* Capacity bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  cls.utilization >= 90 ? 'bg-green-500' :
                  cls.utilization >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${cls.utilization}%`
                }}
              />
            </div>
            
            {/* Student count */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{cls.enrolled} enrolled</span>
              <span>{cls.capacity} capacity</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">
            {classData.filter(c => c.utilization >= 90).length}
          </div>
          <div className="text-xs text-gray-500">Optimal (≥90%)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">
            {classData.filter(c => c.utilization >= 75 && c.utilization < 90).length}
          </div>
          <div className="text-xs text-gray-500">Good (75-89%)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">
            {classData.filter(c => c.utilization < 75).length}
          </div>
          <div className="text-xs text-gray-500">Low (&lt;75%)</div>
        </div>
      </div>
    </div>
  )
}
