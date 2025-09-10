import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { teacherResultsApi, classesApi } from '../../lib/api'
import { api } from '../../lib/axios'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextInput } from '../../components/ui/TextInput'
import { 
  Download, 
  Filter, 
  Search, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Award,
  FileText,
  Calendar,
  BookOpen,
  GraduationCap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export default function TeacherResultsPage() {
  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    term: 'term1',
    academicYear: '2023-2024',
    examType: '',
    page: 1,
    limit: 10
  })

  const [activeTab, setActiveTab] = useState('overview')

  // Get teacher assignments (using the same approach as GradesPage)
  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: async () => {
      console.log('🔍 Fetching teacher profile...')
      const response = await api.get('/teachers/me')
      console.log('📊 Raw API response:', response)
      console.log('📊 Response data:', response.data)
      return response.data
    },
  })
  const assignments = assignmentsData?.data || { subjects: [], classes: [] }
  
  // Fetch teacher's actual classes via scope=enrolled (authoritative)
  const { data: teacherClassesData } = useQuery({
    queryKey: ['classes', 'teacher', 'enrolled'],
    queryFn: async () => {
      const response = await classesApi.getClasses({ scope: 'enrolled', limit: 200 })
      return response
    }
  })
  const teacherClasses = teacherClassesData?.data || assignments.classes || []

  const classes = teacherClasses
  const subjects = assignments.subjects || []

  // Get results data
  const { data: resultsData, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['teacher-results', filters],
    queryFn: () => teacherResultsApi.getResults(filters),
    enabled: !!filters.classId && !!filters.subjectId,
    select: (response) => response.data,
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (params) => teacherResultsApi.exportResults(params),
    onSuccess: (csvData) => {
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `results-${filters.classId}-${filters.subjectId}-${filters.term}-${filters.academicYear}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      window?.toast?.success?.('Results exported successfully!')
    },
    onError: (error) => {
      console.error('Export failed:', error)
      window?.toast?.error?.(error.message || 'Export failed')
    }
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handleExport = () => {
    exportMutation.mutate(filters)
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Transform data for charts
  const gradeDistributionData = useMemo(() => {
    if (!resultsData?.summary?.gradeDistribution) return []
    
    return Object.entries(resultsData.summary.gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: ((count / resultsData.summary.totalStudents) * 100).toFixed(1)
    }))
  }, [resultsData?.summary])

  const examTypeData = useMemo(() => {
    if (!resultsData?.results) return []
    
    const examTypes = {}
    resultsData.results.forEach(result => {
      if (result.regularGrade?.examType) {
        const examType = result.regularGrade.examType
        if (!examTypes[examType]) {
          examTypes[examType] = { count: 0, totalMarks: 0, maxMarks: 0 }
        }
        examTypes[examType].count++
        examTypes[examType].totalMarks += result.regularGrade.marks || 0
        examTypes[examType].maxMarks += result.regularGrade.maxMarks || 0
      }
    })

    return Object.entries(examTypes).map(([examType, data]) => ({
      examType: examType.charAt(0).toUpperCase() + examType.slice(1),
      count: data.count,
      averageScore: data.maxMarks > 0 ? ((data.totalMarks / data.maxMarks) * 100).toFixed(1) : 0
    }))
  }, [resultsData?.results])

  if (assignmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher data...</p>
        </div>
      </div>
    )
  }

  // Debug information
  console.log('🎯 Teacher Profile Data:', assignments)
  console.log('🎯 Teacher Subjects:', assignments.subjects)
  console.log('🎯 Teacher Classes (scoped):', teacherClasses)
  console.log('🎯 Classes:', classes)
  console.log('🎯 Subjects:', subjects)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Results & Analytics</h1>
              <p className="text-white/90 mt-1">Analyze student outcomes across your classes and subjects</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleExport}
                disabled={!resultsData || exportMutation.isPending}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          {resultsData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/80">Total Students</div>
                    <div className="text-xl font-semibold">{resultsData.summary.totalStudents}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/80">Average Score</div>
                    <div className="text-xl font-semibold">{resultsData.summary.averageScore?.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/80">Highest Score</div>
                    <div className="text-xl font-semibold">{resultsData.summary.highestScore}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="text-base sm:text-lg font-semibold">Filters</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class
              </label>
              <Select
                value={filters.classId}
                onChange={(e) => handleFilterChange('classId', e.target.value)}
                className="w-full text-sm"
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((cls) => ({
                    value: cls._id,
                    label: `${cls.name} - ${cls.section}`
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <Select
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="w-full text-sm"
                disabled={!filters.classId}
                options={[
                  { value: '', label: 'Select Subject' },
                  ...subjects
                    .filter(subject => !filters.classId || subject.classId === filters.classId)
                    .map((subject) => ({
                      value: subject._id,
                      label: `${subject.name} (${subject.code})`
                    }))
                ]}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Term
              </label>
              <Select
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="w-full text-sm"
                options={[
                  { value: 'term1', label: 'Term 1' },
                  { value: 'term2', label: 'Term 2' },
                  { value: 'final', label: 'Final' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Academic Year
              </label>
              <TextInput
                type="text"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                placeholder="e.g., 2023-2024"
                className="w-full text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Type (Optional)
              </label>
              <Select
                value={filters.examType}
                onChange={(e) => handleFilterChange('examType', e.target.value)}
                className="w-full sm:w-48 text-sm"
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'assignment', label: 'Assignment' },
                  { value: 'midterm', label: 'Midterm' },
                  { value: 'final', label: 'Final' },
                  { value: 'quiz', label: 'Quiz' }
                ]}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                disabled={!filters.classId || !filters.subjectId}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      {resultsError && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-red-600">
              <p>Error loading results: {resultsError.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {resultsLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </CardContent>
        </Card>
      )}

      {resultsData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-lg sm:text-2xl font-bold">{resultsData.summary.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">With Results</p>
                    <p className="text-lg sm:text-2xl font-bold">{resultsData.summary.studentsWithResults}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                    <p className="text-lg sm:text-2xl font-bold">{resultsData.summary.averageScore?.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Highest Score</p>
                    <p className="text-lg sm:text-2xl font-bold">{resultsData.summary.highestScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-0 sm:space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'results', label: 'Results', icon: FileText },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm rounded-t ${
                    activeTab === tab.id
                      ? 'border-white sm:border-primary-500 text-primary-50 sm:text-primary-600 bg-primary-600 sm:bg-transparent'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.charAt(0)}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold">Grade Distribution</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gradeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {gradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Exam Type Performance */}
              <Card>
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold">Performance by Exam Type</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={examTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="examType" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'results' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Student Results</h3>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {resultsData.class?.name} - {resultsData.subject?.name} ({resultsData.subject?.code})
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {resultsData.results.map((result, index) => (
                    <div key={result.studentId || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                            {result.student?.userId?.name || 
                             result.student?.name || 
                             result.studentName || 
                             result.name ||
                             result.userId?.name ||
                             `Student ${result.studentId || index + 1}`}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            {result.student?.userId?.email || 
                             result.student?.email || 
                             result.email ||
                             result.userId?.email ||
                             'No email'}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.hasResult 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {result.hasResult ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Roll Number:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {result.student?.rollNumber || result.rollNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Exam Type:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {result.regularGrade?.examType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Marks:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {result.hasResult ? (
                              `${result.regularGrade?.marks || 0}/${result.regularGrade?.maxMarks || 0} (${result.regularGrade?.percentage?.toFixed(1)}%)`
                            ) : (
                              'No result'
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                          <p className="font-medium">
                            {result.hasResult ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.regularGrade?.grade === 'A' ? 'bg-green-100 text-green-800' :
                                result.regularGrade?.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                result.regularGrade?.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                result.regularGrade?.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.regularGrade?.grade || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Roll Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Exam Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {resultsData.results.map((result, index) => (
                        <tr key={result.studentId || index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {result.student?.userId?.name || 
                               result.student?.name || 
                               result.studentName || 
                               result.name ||
                               result.userId?.name ||
                               `Student ${result.studentId || index + 1}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {result.student?.userId?.email || 
                               result.student?.email || 
                               result.email ||
                               result.userId?.email ||
                               'No email'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.student?.rollNumber || result.rollNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.hasResult ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.regularGrade?.marks || 0}/{result.regularGrade?.maxMarks || 0}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {result.regularGrade?.percentage?.toFixed(1)}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No result</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.hasResult ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.regularGrade?.grade === 'A' ? 'bg-green-100 text-green-800' :
                                result.regularGrade?.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                result.regularGrade?.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                result.regularGrade?.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.regularGrade?.grade || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {result.regularGrade?.examType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.hasResult 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {result.hasResult ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {resultsData.pagination && resultsData.pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      Showing {((resultsData.pagination.page - 1) * resultsData.pagination.limit) + 1} to{' '}
                      {Math.min(resultsData.pagination.page * resultsData.pagination.limit, resultsData.pagination.total)} of{' '}
                      {resultsData.pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Previous
                      </Button>
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        Page {filters.page} of {resultsData.pagination.pages}
                      </span>
                      <Button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= resultsData.pagination.pages}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Grade Distribution Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold">Grade Distribution Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {gradeDistributionData.map((item, index) => (
                      <div key={item.grade} className="flex items-center justify-between p-2 sm:p-3 rounded border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-sm sm:text-lg">{item.grade}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-medium">{item.count} students</div>
                          <div className="text-xs text-gray-500">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold">Performance Summary</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{resultsData.summary.totalStudents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Students with Results</span>
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{resultsData.summary.studentsWithResults}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Students without Results</span>
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{resultsData.summary.studentsWithoutResults}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</span>
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{resultsData.summary.averageScore?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Highest Score</span>
                      <span className="font-medium text-sm sm:text-base text-green-600">{resultsData.summary.highestScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Lowest Score</span>
                      <span className="font-medium text-sm sm:text-base text-red-600">{resultsData.summary.lowestScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!resultsData && !resultsLoading && !resultsError && filters.classId && filters.subjectId && (
        <Card>
          <CardContent className="text-center py-6 sm:py-8">
            <div className="text-gray-500">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
              <p className="text-sm sm:text-base">No results found for the selected criteria.</p>
              <p className="text-xs sm:text-sm">Try adjusting your filters or check if results have been uploaded.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
