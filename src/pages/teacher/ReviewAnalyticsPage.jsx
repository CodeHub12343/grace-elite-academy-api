import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, TrendingUp, TrendingDown, Target, Award, AlertTriangle, Download, Filter, Calendar, BarChart3, MessageSquare } from 'lucide-react'
import { api } from '../../lib/axios'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function ReviewAnalyticsPage() {
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [dateRange, setDateRange] = useState('90')
  const [viewMode, setViewMode] = useState('performance') // 'performance', 'trends', 'comparison', 'insights'

  // Fetch comprehensive review analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['review-analytics', selectedSubject, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject)
      if (dateRange !== 'all') params.append('days', dateRange)
      
      const response = await api.get(`/reviews/analytics?${params.toString()}`)
      return response.data
    }
  })

  // Fetch teacher's subjects
  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects?scope=mine')
      return response.data
    }
  })

  const handleExportAnalytics = () => {
    const csvContent = convertAnalyticsToCSV(analytics)
    downloadCSV(csvContent, `review-analytics-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const convertAnalyticsToCSV = (data) => {
    if (!data) return ''
    
    const headers = ['Metric', 'Value', 'Change', 'Target', 'Status']
    const rows = [
      ['Overall Rating', data.overallRating?.toFixed(2) || 0, data.ratingChange?.toFixed(2) || 0, '4.0+', data.overallRating >= 4.0 ? 'On Target' : 'Below Target'],
      ['Teaching Quality', data.categoryRatings?.teaching_quality?.toFixed(2) || 0, data.categoryChanges?.teaching_quality?.toFixed(2) || 0, '4.0+', data.categoryRatings?.teaching_quality >= 4.0 ? 'On Target' : 'Below Target'],
      ['Communication', data.categoryRatings?.communication?.toFixed(2) || 0, data.categoryChanges?.communication?.toFixed(2) || 0, '4.0+', data.categoryRatings?.communication >= 4.0 ? 'On Target' : 'Below Target'],
      ['Subject Knowledge', data.categoryRatings?.knowledge?.toFixed(2) || 0, data.categoryChanges?.knowledge?.toFixed(2) || 0, '4.0+', data.categoryRatings?.knowledge >= 4.0 ? 'On Target' : 'Below Target'],
      ['Response Rate', data.responseRate?.toFixed(1) || 0, data.responseRateChange?.toFixed(1) || 0, '80%+', data.responseRate >= 80 ? 'On Target' : 'Below Target']
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

  const getPerformanceColor = (value, target) => {
    if (value >= target) return 'text-green-600'
    if (value >= target * 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (value, target) => {
    if (value >= target) return <Award className="h-5 w-5 text-green-600" />
    if (value >= target * 0.8) return <Target className="h-5 w-5 text-yellow-600" />
    return <AlertTriangle className="h-5 w-5 text-red-600" />
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Analytics & Insights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep dive into your performance metrics and improvement opportunities
          </p>
        </div>
        
        <Button
          onClick={handleExportAnalytics}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Analytics</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Subjects</option>
                              {subjects?.data?.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('performance')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'performance'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setViewMode('trends')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'trends'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'insights'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Insights
          </button>
        </div>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'performance' && (
        <>
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Rating</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics?.overallRating || 0, 4.0)}`}>
                    {analytics?.overallRating?.toFixed(1) || 0}/5
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: 4.0+
                  </p>
                </div>
                {getPerformanceIcon(analytics?.overallRating || 0, 4.0)}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-xs">
                  {analytics?.ratingChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={analytics?.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics?.ratingChange >= 0 ? '+' : ''}{analytics?.ratingChange?.toFixed(2) || 0} from last period
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics?.responseRate || 0, 80)}`}>
                    {analytics?.responseRate?.toFixed(0) || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: 80%+
                  </p>
                </div>
                {getPerformanceIcon(analytics?.responseRate || 0, 80)}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-xs">
                  {analytics?.responseRateChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={analytics?.responseRateChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics?.responseRateChange >= 0 ? '+' : ''}{analytics?.responseRateChange?.toFixed(1) || 0}% from last period
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.totalReviews || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analytics?.recentReviews || 0} this period
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Score</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics?.satisfactionScore || 0, 80)}`}>
                    {analytics?.satisfactionScore?.toFixed(0) || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: 80%+
                  </p>
                </div>
                {getPerformanceIcon(analytics?.satisfactionScore || 0, 80)}
              </div>
            </Card>
          </div>

          {/* Category Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics?.categoryPerformance?.map((category) => (
                <div key={category.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h4>
                    <span className={`text-sm font-semibold ${getPerformanceColor(category.rating, 4.0)}`}>
                      {category.rating.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        category.rating >= 4.0 ? 'bg-green-500' : 
                        category.rating >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(category.rating / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Target: 4.0+
                    </span>
                    <span className={getPerformanceColor(category.rating, 4.0)}>
                      {category.rating >= 4.0 ? 'On Target' : 'Below Target'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.ratingDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics?.ratingDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.performanceTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="teaching" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="communication" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Trends Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.ratingTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="overall" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                <Area type="monotone" dataKey="teaching" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="communication" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.monthlyPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rating" fill="#8B5CF6" />
                <Bar dataKey="target" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Response Time Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Time Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.responseTimeTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgResponseTime" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Review Volume Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Volume Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.reviewVolumeTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reviews" fill="#3B82F6" />
                <Bar dataKey="responses" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {viewMode === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.subjectComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rating" fill="#3B82F6" />
                <Bar dataKey="target" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Peer Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peer Comparison</h3>
            <div className="space-y-4">
              {analytics?.peerComparison?.map((peer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {peer.category}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Department average
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {peer.yourRating.toFixed(1)} vs {peer.avgRating.toFixed(1)}
                    </p>
                    <p className={`text-xs ${
                      peer.yourRating >= peer.avgRating ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {peer.yourRating >= peer.avgRating ? 'Above' : 'Below'} average
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Historical Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historical Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.historicalComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="previous" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Benchmark Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benchmark Analysis</h3>
            <div className="space-y-4">
              {analytics?.benchmarkAnalysis?.map((benchmark, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {benchmark.metric}
                    </h4>
                    <span className={`text-sm font-semibold ${
                      benchmark.status === 'excellent' ? 'text-green-600' :
                      benchmark.status === 'good' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {benchmark.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Your score: {benchmark.yourScore}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Benchmark: {benchmark.benchmark}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'insights' && (
        <>
          {/* Key Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics?.keyInsights?.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  insight.type === 'positive' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      insight.type === 'positive' ? 'bg-green-500' :
                      insight.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Improvement Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Improvement Recommendations</h3>
            <div className="space-y-4">
              {analytics?.improvementRecommendations?.map((rec, index) => (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Priority: {rec.priority}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Expected impact: {rec.expectedImpact}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Time to implement: {rec.timeToImplement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Action Items</h3>
            <div className="space-y-3">
              {analytics?.actionItems?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`action-${index}`}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div>
                      <label htmlFor={`action-${index}`} className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                        {item.action}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {item.dueDate}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}



