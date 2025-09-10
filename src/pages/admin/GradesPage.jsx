import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teacherGradesApi, studentsApi, subjectsApi, classesApi } from '../../lib/api'

function Section({ title, children, actions }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="font-medium">{title}</div>
        <div className="flex items-center gap-2">{actions}</div>
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

export function GradesPage() {
  const [filters, setFilters] = useState({ 
    classId: '', 
    subjectId: '', 
    term: '', 
    academicYear: '',
    studentId: '',
    teacherId: '',
    status: ''
  })

  // Get all grades (admin can see all)
  const { data: gradesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-grades', filters],
    queryFn: () => teacherGradesApi.getMyGrades(filters), // Using teacher endpoint for now
    enabled: true,
  })
  const grades = gradesData?.data || []
  const gradesSummary = gradesData?.summary || {}

  // Get students, subjects, classes for filters
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list(),
  })
  const students = studentsData?.data || []

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.list(),
  })
  const subjects = subjectsData?.data || []

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
  })
  const classes = classesData?.data || []

  const termOptions = [
    { value: '', label: 'All Terms' },
    { value: 'term1', label: 'Term 1' },
    { value: 'term2', label: 'Term 2' },
    { value: 'final', label: 'Final' }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Kpi title="Total Grades" value={gradesData?.count || 0} />
        <Kpi title="Published" value={grades.filter(g => g.isPublished).length} />
        <Kpi title="Draft" value={grades.filter(g => !g.isPublished).length} />
        <Kpi title="Average Grade" value={Object.keys(gradesSummary).length > 0 ? 
          Object.entries(gradesSummary).map(([grade, data]) => `${grade}: ${data.count}`).join(', ') : 
          'N/A'
        } />
              </div>

      <Section title="Grade Management" actions={<button onClick={() => refetch()} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Refresh</button>}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <select
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
          
          <select 
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.subjectId}
            onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          
                <select
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
          >
            {termOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
                </select>
          
                <select
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <input
            type="text"
            placeholder="Academic Year (e.g., 2023-2024)"
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.academicYear}
            onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
          />
          
          <select 
            className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
          >
            <option value="">All Students</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.userId?.name || s.rollNumber}</option>
            ))}
          </select>
          </div>

        {isLoading ? (
          <div className="text-center py-8">Loading grades...</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2">Student</th>
                  <th className="text-left px-3 py-2">Subject</th>
                  <th className="text-left px-3 py-2">Class</th>
                  <th className="text-left px-3 py-2">Teacher</th>
                  <th className="text-left px-3 py-2">Term</th>
                  <th className="text-left px-3 py-2">Marks</th>
                  <th className="text-left px-3 py-2">Grade</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.length > 0 ? grades.map((grade) => (
                  <tr key={grade._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{grade.studentId?.userId?.name || grade.studentId?.rollNumber}</td>
                    <td className="px-3 py-2">{grade.subjectId?.name}</td>
                    <td className="px-3 py-2">{grade.classId?.name}</td>
                    <td className="px-3 py-2">{grade.teacherId?.userId?.name}</td>
                    <td className="px-3 py-2 capitalize">{grade.term}</td>
                    <td className="px-3 py-2">{grade.marks}/{grade.maxMarks} ({grade.percentage}%)</td>
                    <td className="px-3 py-2 font-medium">{grade.grade}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${grade.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {grade.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(grade.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={9}>No grades found</td></tr>
                    )}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Grade Distribution">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Grade Distribution</h3>
            <div className="space-y-2">
              {Object.entries(gradesSummary).map(([grade, data]) => (
                <div key={grade} className="flex justify-between items-center">
                  <span className="font-medium">Grade {grade}</span>
                  <span>{data.count} students ({Math.round((data.count / grades.length) * 100)}%)</span>
                </div>
              ))}
            </div>
                      </div>
          
          <div>
            <h3 className="font-medium mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {grades.slice(0, 5).map((grade) => (
                <div key={grade._id} className="text-sm">
                  <span className="font-medium">{grade.studentId?.userId?.name}</span> - {grade.subjectId?.name} ({grade.grade})
                  <div className="text-xs text-gray-500">
                    {new Date(grade.createdAt).toLocaleDateString()}
                      </div>
                </div>
              ))}
            </div>
                </div>
              </div>
      </Section>
    </div>
  )
}

export default GradesPage