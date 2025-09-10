import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { termResultsApi } from '../../lib/api'
import { Award, BarChart3, TrendingUp, Calendar, Filter, CheckCircle2 } from 'lucide-react'

export function StudentTermResultsPage() {
  const { user } = useAuth()
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // Fetch term results directly using "me" alias
  const { data: termResultsData, isLoading, error, refetch } = useQuery({
    queryKey: ['term-results', 'student', 'me', selectedTerm, selectedYear],
    queryFn: () => termResultsApi.getStudentResults('me', {
      term: selectedTerm || undefined,
      academicYear: selectedYear || undefined
    }),
    enabled: !!user
  })

  // Generate academic years (current year + 2 previous)
  const currentYear = new Date().getFullYear()
  const academicYears = Array.from({ length: 3 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`)

  // Grade system configuration
  const gradeSystem = {
    'A': { range: '70-100%', interpretation: 'Excellent', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-200' },
    'B': { range: '60-69%', interpretation: 'Very Good / Good', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200' },
    'C': { range: '50-59%', interpretation: 'Credit (Pass)', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200' },
    'D': { range: '45-49%', interpretation: 'Pass', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-200' },
    'E': { range: '40-44%', interpretation: 'Weak Pass', color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200' },
    'F': { range: '0-39%', interpretation: 'Fail', color: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-200' }
  }


  // Get grade color
  const getGradeColor = (grade) => {
    return gradeSystem[grade]?.color || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
  }

  // Compute grade letter from percentage based on current grading scheme
  const getGradeFromPercentage = (percentage) => {
    const p = Number(percentage) || 0
    if (p >= 70) return 'A'
    if (p >= 60) return 'B'
    if (p >= 50) return 'C'
    if (p >= 45) return 'D'
    if (p >= 40) return 'E'
    return 'F'
  }

  // Get grade interpretation
  const getGradeInterpretation = (grade) => {
    return gradeSystem[grade]?.interpretation || 'Unknown'
  }

  // Get performance remarks based on grade
  const getPerformanceRemarks = (percentage, grade) => {
    const interpretation = getGradeInterpretation(grade)
    switch (grade) {
      case 'A': return `Excellent performance! ${interpretation} - Keep up the outstanding work.`
      case 'B': return `Good performance. ${interpretation} - Continue to maintain this level.`
      case 'C': return `Satisfactory performance. ${interpretation} - There's room for improvement.`
      case 'D': return `Passing performance. ${interpretation} - More effort is needed to improve.`
      case 'E': return `Weak passing performance. ${interpretation} - Significant improvement required.`
      case 'F': return `Failing performance. ${interpretation} - Immediate attention and remedial work required.`
      default: return 'Performance assessment pending.'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <div className="text-gray-700 dark:text-gray-300">Loading your term results...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Results
        </h3>
        <p className="text-sm sm:text-base text-red-700 dark:text-red-300">{error.message}</p>
      </div>
    )
  }

  const results = termResultsData?.data || []

  // Compute summary metrics
  const totalResults = results.length
  const avgPerformance = totalResults
    ? Math.round(results.reduce((sum, r) => sum + (r.averagePercentage || 0), 0) / totalResults)
    : 0
  const bestGrade = totalResults
    ? results.reduce((best, r) => {
        const current = getGradeFromPercentage(r.averagePercentage)
        const order = { 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1 }
        return order[current] > order[best] ? current : best
      }, 'F')
    : '-'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Print Styles */}
      <style>{`
        /* Base table lines (screen and print) */
        .print-table { border-collapse: collapse; width: 100%; }
        .print-table th, .print-table td { border: 1px solid #e5e7eb; }
        .print-table thead th { border-bottom: 2px solid #111827; font-weight: 700; }
        .print-table tr:last-child td { border-bottom: 2px solid #111827; }

        @media (prefers-color-scheme: dark) {
          .print-table th, .print-table td { border-color: #374151; }
          .print-table thead th { border-bottom-color: #9ca3af; }
          .print-table tr:last-child td { border-bottom-color: #9ca3af; }
        }

        /* Print-specific tweaks */
        @media print {
          body { background: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .print-page-break { page-break-after: always; }
          .print-text-dark { color: #000000 !important; }
          .print-table th, .print-table td { border-color: #e5e7eb !important; }
          .print-table thead th { border-bottom: 2px solid #111827 !important; }
          .print-table tr:last-child td { border-bottom: 2px solid #111827 !important; }
        }
      `}</style>
      {/* Gradient Header */}
      <div className="rounded-2xl overflow-hidden no-print">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Term Results</h1>
              <p className="text-white/90 mt-1">View your academic performance across terms and subjects</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => refetch()} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                Refresh
              </Button>
              <Button onClick={() => window.print()} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                Print All
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/80">Total Results</div>
                  <div className="text-xl font-semibold">{totalResults}</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/80">Average Performance</div>
                  <div className="text-xl font-semibold">{avgPerformance}%</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/80">Best Grade</div>
                  <div className="text-xl font-semibold">{bestGrade}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 no-print">
        <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
          <Filter className="w-4 h-4" />
          <h3 className="text-base sm:text-lg font-semibold">Filter Results</h3>
          <div className="ml-auto text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Showing: Term {selectedTerm || 'All'}, Year {selectedYear || 'All'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Term</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: '' },
                { label: 'Term 1', value: 'term1' },
                { label: 'Term 2', value: 'term2' },
                { label: 'Final', value: 'final' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTerm(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    selectedTerm === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Year
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 text-sm"
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden print-card print-page-break">
              {/* Result Header (Printable style) */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white print-text-dark">
                      Student Result – {String(result.term || '').toUpperCase()} ({result.academicYear})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 print-text-dark">
                      Class: {result.classId?.name} • Uploaded: {new Date(result.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white print-text-dark">
                      {result.averagePercentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 print-text-dark">
                      {result.totalMarks}/{result.totalMaxMarks} marks
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {(() => { const g = getGradeFromPercentage(result.averagePercentage); return (
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getGradeColor(g)}`}>
                          Grade: {g}
                        </span>
                      )})()}
                      <Button onClick={() => window.print()} className="no-print" size="sm" variant="outline">Print</Button>
                    </div>
                    {(() => { const g = getGradeFromPercentage(result.averagePercentage); return (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 print-text-dark">
                        {gradeSystem[g]?.range || 'N/A'} • {gradeSystem[g]?.interpretation || 'Unknown'}
                      </div>
                    )})()}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 print-text-dark">
                  {(() => { const g = getGradeFromPercentage(result.averagePercentage); return result.overallRemarks || getPerformanceRemarks(result.averagePercentage, g) })()}
                </p>
              </div>

              {/* Subject Breakdown - Table for print and desktop */}
              <div className="px-4 sm:px-6 py-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 print-text-dark">Subject Performance</h4>

                {/* Table view (shown on print and large screens) */}
                <div className="hidden lg:block print:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 print-table">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Subject</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Exam Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Score</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Percentage</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Grade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {result.subjects?.map((subject, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print-text-dark">{subject.subjectName}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 print-text-dark">{subject.subjectCode}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 print-text-dark">{subject.examType}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print-text-dark">{subject.marks}/{subject.maxMarks}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white print-text-dark">{subject.percentage}%</td>
                            <td className="px-4 py-2 text-sm print-text-dark">
                              {(() => { const perc = subject?.percentage ?? (subject?.maxMarks ? (subject.marks / subject.maxMarks) * 100 : 0); const g = getGradeFromPercentage(perc); return (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(g)}`}>{g}</span>
                              ) })()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 print-text-dark">{subject.remarks || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card grid view (screen only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden print:hidden">
                  {result.subjects?.map((subject, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900 dark:text-white truncate">{subject.subjectName}</h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{subject.subjectCode}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{subject.examType}</div>
                        </div>
                        <div className="text-right">
                          {(() => { const perc = subject?.percentage ?? (subject?.maxMarks ? (subject.marks / subject.maxMarks) * 100 : 0); const g = getGradeFromPercentage(perc); return (
                            <>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(g)}`}>{g}</span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{gradeSystem[g]?.range || 'N/A'}</div>
                            </>
                          ) })()}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                          <span>Score</span>
                          <span>{subject.marks}/{subject.maxMarks} • {subject.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" style={{ width: `${Math.min(100, Math.max(0, subject.percentage || 0))}%` }}></div>
                        </div>
                      </div>
                      {subject.remarks && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          <CheckCircle2 className="inline w-4 h-4 text-emerald-500 mr-1" />
                          {subject.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Additional Comments */}
                {result.comments && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 print-text-dark">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 print-text-dark">Additional Comments</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300 print-text-dark">{result.comments}</p>
                  </div>
                )}
              </div>

              {/* Overall Performance (bullet style like sample) */}
              <div className="px-4 sm:px-6 pb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2 print-text-dark">Overall Performance</h4>
                {(() => { const g = getGradeFromPercentage(result.averagePercentage); return (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-100 print-text-dark">
                    <li><span className="font-semibold">Total Marks:</span> {result.totalMarks}/{result.totalMaxMarks}</li>
                    <li><span className="font-semibold">Overall Percentage:</span> {result.averagePercentage}%</li>
                    <li><span className="font-semibold">Grade:</span> {g} ({gradeSystem[g]?.range || 'N/A'})</li>
                    <li><span className="font-semibold">Remark:</span> {result.overallRemarks || getPerformanceRemarks(result.averagePercentage, g)}</li>
                  </ul>
                ) })()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Term Results Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {selectedTerm || selectedYear 
              ? 'No results found for the selected criteria. Try adjusting your filters.'
              : 'Your term results will appear here once they are published by your teachers.'
            }
          </p>
        </div>
      )}

      {/* Grade System Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 no-print">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
          Grading System
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-200 dark:border-blue-700">
                <th className="text-left py-2 px-2 font-medium text-blue-800 dark:text-blue-200">Grade</th>
                <th className="text-left py-2 px-2 font-medium text-blue-800 dark:text-blue-200">Score Range (%)</th>
                <th className="text-left py-2 px-2 font-medium text-blue-800 dark:text-blue-200">Interpretation</th>
              </tr>
            </thead>
            <tbody className="text-blue-700 dark:text-blue-300">
              {Object.entries(gradeSystem).map(([grade, info]) => (
                <tr key={grade} className="border-b border-blue-100 dark:border-blue-800">
                  <td className="py-2 px-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${info.color}`}>
                      {grade}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-medium">{info.range}</td>
                  <td className="py-2 px-2">{info.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Information */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 no-print">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          About Term Results
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Term results are published by your teachers and administrators</li>
          <li>• Only published results are visible to students</li>
          <li>• Results include performance across all subjects for the selected term</li>
          <li>• Grades are calculated based on your percentage scores using the above grading system</li>
          <li>• Contact your teacher if you have questions about your results</li>
        </ul>
      </div>
    </div>
  )
}

export default StudentTermResultsPage







