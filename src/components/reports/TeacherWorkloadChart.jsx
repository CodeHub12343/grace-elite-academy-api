import React from 'react'

export function TeacherWorkloadChart({ data = [] }) {
  // Use provided data or fallback to mock data
  const workloadData = data.length > 0 ? data : [
    { teacher: 'Dr. Smith', subjects: 4, classes: 3, students: 85 },
    { teacher: 'Ms. Johnson', subjects: 3, classes: 2, students: 65 },
    { teacher: 'Mr. Davis', subjects: 5, classes: 4, students: 120 },
    { teacher: 'Dr. Wilson', subjects: 2, classes: 2, students: 45 },
    { teacher: 'Ms. Brown', subjects: 4, classes: 3, students: 90 },
  ]

  const maxStudents = Math.max(...workloadData.map(d => d.students))

  return (
    <div className="w-full h-64">
      <div className="space-y-3">
        {workloadData.map((teacher, index) => (
          <div key={index} className="space-y-2">
            {/* Teacher name and stats */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {teacher.teacher}
              </span>
              <div className="flex space-x-4 text-xs text-gray-500">
                <span>{teacher.subjects} subjects</span>
                <span>{teacher.classes} classes</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {teacher.students} students
                </span>
              </div>
            </div>
            
            {/* Workload bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(teacher.students / maxStudents) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {workloadData.reduce((sum, t) => sum + t.subjects, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Subjects</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {workloadData.reduce((sum, t) => sum + t.classes, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Classes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {workloadData.reduce((sum, t) => sum + t.students, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Students</div>
        </div>
      </div>
    </div>
  )
}
