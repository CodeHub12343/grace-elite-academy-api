import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Target, Award, Download, Calendar, TrendingUp } from 'lucide-react'
import { api } from '../../../lib/axios'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

export default function GradeAnalyticsPage() {
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')

  // Fetch grade analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['grade-analytics', selectedClass, selectedSubject],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedClass !== 'all') params.append('classId', selectedClass)
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject)
      
      const response = await api.get(`/grades/analytics?${params.toString()}`)
      return response.data
    }
  })

  // Extract the actual analytics data from the response
  const analyticsData = analytics?.data?.[0] || null

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Fetch subjects for dropdown
  const { data: subjects } = useQuery({
    queryKey: ['subjects', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/subjects', { params: { scope: 'mine' } })
      return response.data
    }
  })

  const handleExportAnalytics = () => {
    const csvContent = convertAnalyticsToCSV(analytics)
    downloadCSV(csvContent, `grade-analytics-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const convertAnalyticsToCSV = (data) => {
    if (!data || !analyticsData) return ''
    
    const headers = ['Metric', 'Value', 'Details']
    const rows = [
      ['Total Students', analyticsData.count, 'Number of students with grades'],
      ['Average Percentage', `${analyticsData.avgPercentage?.toFixed(2) || 0}%`, 'Average percentage across all students'],
      ['Average Marks', analyticsData.avgMarks?.toFixed(2) || 0, 'Average marks achieved'],
      ['Highest Score', `${analyticsData.maxPercentage || 0}%`, 'Best performing student'],
      ['Lowest Score', `${analyticsData.minPercentage || 0}%`, 'Lowest performing student'],
      ['Date', `${analyticsData._id?.year}-${analyticsData._id?.month}-${analyticsData._id?.day}`, 'Date of analysis']
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

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading analytics: {error.message}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Grade Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View performance insights for your classes and subjects
          </p>
        </div>
        
        <Button
          onClick={handleExportAnalytics}
          disabled={!analyticsData}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Report</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Simple Filters */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Classes</option>
                              {classes?.data?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
                              <option value="all">All Subjects</option>
                {subjects?.data?.map(subject => (
                <option key={subject._id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      {analyticsData ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.count || 0}
              </p>
                  <p className="text-xs text-gray-500">Students with grades</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Average Percentage</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.avgPercentage?.toFixed(1) || 0}%
              </p>
                  <p className="text-xs text-gray-500">Across all students</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Average Marks</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.avgMarks?.toFixed(1) || 0}
              </p>
                  <p className="text-xs text-gray-500">Raw marks achieved</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Highest Score</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.maxPercentage || 0}%
              </p>
                  <p className="text-xs text-gray-500">Best performing student</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Lowest Score</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.minPercentage || 0}%
                  </p>
                  <p className="text-xs text-gray-500">Lowest performing student</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Analysis Date</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData._id?.day || 0}
              </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData._id?.month ? new Date(analyticsData._id.year, analyticsData._id.month - 1, analyticsData._id.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

          {/* Summary Insights */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analyticsData.count || 0}
                    </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Students Analyzed</div>
                    </div>
              
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {analyticsData.avgPercentage?.toFixed(1) || 0}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Class Average</div>
            </div>
              
              <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analyticsData.maxPercentage - analyticsData.minPercentage || 0}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Score Range</div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Performance Assessment</h4>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Class performance: {analyticsData.avgPercentage >= 70 ? 'Excellent' : analyticsData.avgPercentage >= 60 ? 'Good' : analyticsData.avgPercentage >= 50 ? 'Average' : 'Needs Improvement'}</p>
                <p>• Score distribution: {analyticsData.maxPercentage || 0}% (highest) to {analyticsData.minPercentage || 0}% (lowest)</p>
                <p>• Analysis period: {analyticsData._id?.month ? new Date(analyticsData._id.year, analyticsData._id.month - 1, analyticsData._id.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-6 sm:p-8 text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            <p className="text-base sm:text-lg font-medium mb-2">No Analytics Data Available</p>
            <p className="text-sm">Try selecting different class or subject combinations</p>
            <p className="text-xs mt-2">Note: Analytics are only available when grades have been recorded</p>
        </div>
      </Card>
      )}
    </div>
  )
}



