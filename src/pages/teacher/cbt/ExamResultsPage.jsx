import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { reportsApi, cbtApi, examsApi } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { BarChart3, TrendingUp, Users, Award, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export function ExamResultsPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null) // attempts, average, pass, fail
  const [classResults, setClassResults] = useState(null) // class results with distribution
  const [exam, setExam] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [examRes, analyticsRes, classRes] = await Promise.all([
          examsApi.get(id),
          reportsApi.getExamAnalytics(id),
          cbtApi.classResults(id),
        ])
        if (!active) return
        setExam(examRes?.data || examRes)
        setSummary(analyticsRes?.data || analyticsRes)
        setClassResults(classRes?.data || classRes)
      } catch (e) {
        if (!active) return
        setError(e?.message || 'Failed to load exam analytics')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  const exportCsv = () => {
    if (!classResults?.data) return
    
    const rows = classResults.data.map(r => ({
      student: r.studentName || r.studentId?.userId?.name || r.studentId?.rollNumber || 'Unknown',
      score: r.score || r.percentage || 0,
      submittedAt: r.submittedAt || r.createdAt || 'N/A',
      status: r.score >= 50 ? 'Pass' : 'Fail'
    }))
    
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const lines = [headers.join(',')]
    rows.forEach(r => {
      lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exam_${id}_results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Loading results...</span>
    </div>
  )
  
  if (error) return (
    <div className="rounded-xl border border-red-200 text-red-700 bg-red-50 p-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Error: {error}</span>
      </div>
    </div>
  )

  // Extract data from the new structure
  const examData = classResults || {}
  const attempts = examData.count || summary?.attempts || 0
  const avgScore = examData.averageScore || summary?.average || 0
  const distribution = examData.distribution || {}
  
  // Calculate pass/fail based on 50% threshold
  const passCount = examData.data?.filter(s => (s.score || s.percentage || 0) >= 50).length || 0
  const failCount = attempts - passCount

  // Score distribution data for visualization
  const distributionData = Object.entries(distribution).map(([range, count]) => ({
    range,
    count,
    percentage: Math.round((count / attempts) * 100)
  }))

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (score >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return <Award className="h-4 w-4" />
    if (score >= 60) return <CheckCircle className="h-4 w-4" />
    if (score >= 40) return <Clock className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Exam Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {exam?.title ? exam.title : 'Exam Performance Analysis'}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!examData.data?.length}>
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</div>
              <div className="text-2xl font-semibold">{attempts}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
              <div className="text-2xl font-semibold">{avgScore.toFixed(1)}%</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
              <div className="text-2xl font-semibold text-green-600">{passCount}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              <div className="text-2xl font-semibold text-red-600">{failCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Score Distribution */}
      {distributionData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Score Distribution</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {distributionData.map(({ range, count, percentage }) => (
              <div key={range} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-16 text-sm font-medium">{range}</div>
                  <div className="w-20 text-sm text-gray-600">{count} students</div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-right">{percentage}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Individual Results Table */}
      {examData.data && examData.data.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Student Results</h3>
            <div className="text-sm text-gray-600">
              Showing {examData.data.length} of {attempts} results
            </div>
          </div>
          
          <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Roll Number</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted At</th>
            </tr>
          </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                 {examData.data.map((result, index) => {
                   const score = result.score || result.percentage || 0
                   const status = score >= 50 ? 'Pass' : 'Fail'
                   
                   return (
                    <tr key={result._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {result.studentId?.userId?.name?.charAt(0) || result.studentId?.rollNumber?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {result.studentId?.userId?.name || 'Unknown Student'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.studentId?.classId?.name || 'Unknown Class'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {result.studentId?.rollNumber || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {getScoreIcon(score)}
                          <span className={`ml-2 font-medium ${getScoreColor(score)}`}>
                            {score.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          score >= 50 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {result.submittedAt || result.createdAt 
                          ? new Date(result.submittedAt || result.createdAt).toLocaleString()
                          : '-'
                        }
                      </td>
              </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
        </Card>
      )}

      {(!examData.data || examData.data.length === 0) && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Results Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Students haven't submitted this exam yet. Check back later for results.
          </p>
        </Card>
      )}
    </div>
  )
}












