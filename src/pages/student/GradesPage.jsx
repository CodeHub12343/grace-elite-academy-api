import { useState } from 'react'
 import { useQuery } from '@tanstack/react-query'
import { teacherGradesApi } from '../../lib/api'

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="font-medium">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Kpi({ title, value, subtitle }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function GradeCard({ subject }) {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100'
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">{subject.subjectName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{subject.subjectCode}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(subject.grade)}`}>
          Grade {subject.grade}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Marks</div>
          <div className="font-medium">{subject.marks}/{subject.maxMarks}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Percentage</div>
          <div className="font-medium">{subject.percentage}%</div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">Teacher</div>
        <div className="font-medium">{subject.teacherName}</div>
      </div>
      
      {subject.remarks && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">Remarks</div>
          <div className="text-sm italic">"{subject.remarks}"</div>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {subject.examTitle} • {new Date(subject.examDate).toLocaleDateString()}
      </div>
    </div>
  )
}

export function StudentGradesPage() {
  const [filters, setFilters] = useState({ 
    term: '', 
    academicYear: '' 
  })

  // Get student's comprehensive grades
  const { data: gradesData, isLoading, error } = useQuery({
    queryKey: ['student-grades', filters],
    queryFn: () => teacherGradesApi.getStudentComprehensiveGrades('me', filters),
    enabled: true,
  })
  const grades = gradesData?.data || []

  const termOptions = [
    { value: '', label: 'All Terms' },
    { value: 'term1', label: 'Term 1' },
    { value: 'term2', label: 'Term 2' },
    { value: 'final', label: 'Final' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your grades...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg text-red-600">Failed to load grades</div>
          <div className="text-sm text-gray-600 mt-2">{error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Grades</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View and filter your subject grades</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <select 
          className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}
        >
          {termOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
        <input 
          type="text"
          placeholder="Academic Year (e.g., 2023-2024)"
          className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          value={filters.academicYear}
          onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
        />
      </div>

      {grades.length === 0 ? (
        <Section title="My Grades">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">No grades found</div>
            <div className="text-sm text-gray-500 mt-2">
              {filters.term || filters.academicYear 
                ? 'Try adjusting your filters' 
                : 'Your teachers\'t published any grades yet'
              }
            </div>
          </div>
        </Section>
      ) : (
        grades.map((termData) => (
          <Section key={`${termData.term}-${termData.academicYear}`} title={`${termData.term.charAt(0).toUpperCase() + termData.term.slice(1)} - ${termData.academicYear}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Kpi 
                title="Total Subjects" 
                value={termData.subjects.length} 
              />
              <Kpi 
                title="Average Percentage" 
                value={`${termData.averagePercentage}%`} 
              />
              <Kpi 
                title="Total Marks" 
                value={`${termData.totalMarks}/${termData.totalMaxMarks}`} 
              />
              <Kpi 
                title="Overall Grade" 
                value={termData.averagePercentage >= 85 ? 'A' : 
                       termData.averagePercentage >= 70 ? 'B' : 
                       termData.averagePercentage >= 55 ? 'C' : 
                       termData.averagePercentage >= 40 ? 'D' : 'F'} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {termData.subjects.map((subject, subjectIndex) => (
                <GradeCard key={subjectIndex} subject={subject} />
              ))}
            </div>
          </Section>
        ))
      )}
    </div>
  )
} 

export default StudentGradesPage 

 