import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Download } from 'lucide-react'
import { api } from '../../../lib/axios'
import { cbtApi } from '../../../lib/api'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ExamAnalyticsPage() {
  const [selectedExam, setSelectedExam] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [selectedClass, setSelectedClass] = useState('all')

  // Fetch class results for a specific exam (backend: /cbt/results/class/:examId)
  const { data: classResults, isLoading } = useQuery({
    queryKey: ['cbt','classResults', selectedExam],
    queryFn: () => cbtApi.classResults(selectedExam),
    enabled: selectedExam !== 'all' && !!selectedExam,
  })

  // Normalize results into simple analytics and distribution data for charts
  const analytics = useMemo(() => {
    if (!classResults?.data) return null
    const avg = classResults.data.averageScore || 0
    const dist = classResults.data.distribution || { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    const distributionData = Object.keys(dist).map((range) => ({ range, count: dist[range] }))
    return { averageScore: avg, count: classResults.data.count || 0, distributionData }
  }, [classResults])

  // Fetch exams for dropdown
  const { data: exams } = useQuery({
    queryKey: ['exams', 'list'],
    queryFn: async () => {
      const response = await api.get('/exams')
      return response.data
    }
  })

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'list'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data
    }
  })

  const handleExportResults = () => {
    const csvContent = convertAnalyticsToCSV(analytics)
    downloadCSV(csvContent, `exam-analytics-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const convertAnalyticsToCSV = (data) => {
    if (!data) return ''
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Submissions', data.count],
      ['Average Score', data.averageScore]
    ]
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Exam Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Comprehensive insights and performance metrics for your exams
          </p>
        </div>
        
        <Button
          onClick={handleExportResults}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Report</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Exams</option>
              {exams?.data?.map(exam => (
                <option key={exam._id} value={exam._id}>{exam.title}</option>
              ))}
            </select>
          </div>
          {/* Class and date filters removed for now; backend endpoint returns aggregated class results per exam */}
        </div>
      </Card>

      {/* Key Metrics (simplified to use backend class results) */}
      {selectedExam === 'all' ? (
        <Card className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Select an exam to view analytics.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Submissions</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{analytics?.count || 0}</div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{analytics?.averageScore?.toFixed ? analytics.averageScore.toFixed(1) : analytics?.averageScore || 0}</div>
          </Card>
        </div>
      )}

      {/* Charts */}
      {selectedExam !== 'all' && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Score Distribution */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RBarChart data={analytics?.distributionData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </RBarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Detailed insights removed for now; backend class results doesn't provide this breakdown */}
    </div>
  )
}





