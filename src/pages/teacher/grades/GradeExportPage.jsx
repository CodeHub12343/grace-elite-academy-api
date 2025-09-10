import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, BarChart3, Users, Calendar, Filter, Settings, Eye, Mail } from 'lucide-react'
import { api } from '../../../lib/axios'
import { classesApi, subjectsApi, gradesApi } from '../../../lib/api'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'

export default function GradeExportPage() {
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [exportFormat, setExportFormat] = useState('csv')
  const [includeDetails, setIncludeDetails] = useState(true)
  const [includeComments, setIncludeComments] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)

  // Fetch grade data using teacher-specific endpoint
  const { data: gradesResponse, isLoading, error: gradesError } = useQuery({
    queryKey: ['grades', 'teacher', selectedClass, selectedSubject, selectedExam, selectedTerm, dateRange],
    queryFn: async () => {
      // Use teacher-specific endpoint when class and subject are selected
      if (selectedClass !== 'all' && selectedSubject !== 'all') {
        const params = {}
        if (selectedExam !== 'all') params.examType = selectedExam
        if (selectedTerm !== 'all') params.term = selectedTerm
        if (dateRange !== 'all') params.dateRange = dateRange
        
        return gradesApi.teacher(selectedSubject, selectedClass, params)
      } else {
        // Fallback to general grades endpoint for "all" selections
        const params = {}
        if (selectedClass !== 'all') params.classId = selectedClass
        if (selectedSubject !== 'all') params.subjectId = selectedSubject
        if (selectedExam !== 'all') params.examId = selectedExam
        if (selectedTerm !== 'all') params.term = selectedTerm
        if (dateRange !== 'all') params.dateRange = dateRange
        
        return gradesApi.list(params)
      }
    },
    enabled: selectedClass !== 'all' && selectedSubject !== 'all' // Only fetch when both class and subject are selected
  })

  // Extract grades array safely and map to expected format
  const rawGrades = gradesResponse?.data || gradesResponse || []
  const grades = rawGrades.map(grade => ({
    studentName: grade?.studentId?.userId?.name || grade?.studentId?.rollNumber || 'N/A',
    className: grade?.classId?.name || 'N/A',
    subjectName: grade?.subjectId?.name || 'N/A',
    examTitle: grade?.examId?.title || grade?.examType || 'N/A',
    score: grade?.marks || 0,
    maxScore: grade?.maxMarks || 100,
    percentage: grade?.percentage || 0,
    grade: grade?.grade || 'N/A',
    status: grade?.percentage >= 50 ? 'passed' : 'failed',
    date: grade?.createdAt || new Date(),
    comments: grade?.comments || ''
  }))

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: () => classesApi.getClasses({ scope: 'mine' })
  })

  // Fetch subjects for dropdown
  const { data: subjects } = useQuery({
    queryKey: ['subjects', 'teacher'],
    queryFn: () => subjectsApi.getSubjects({ scope: 'mine' })
  })



  const handlePreview = () => {
    if (!grades || !Array.isArray(grades)) {
      setPreviewData([])
    } else {
    setPreviewData(grades)
    }
    setShowPreviewModal(true)
  }

  // Helper function to check if a subject is assigned to a class
  const isSubjectAssignedToClass = (subjectId, classId) => {
    if (!subjectId || !classId || subjectId === 'all' || classId === 'all') return false
    
    const subject = subjects?.data?.find(s => s._id === subjectId)
    return subject?.classId === classId
  }

  // Get valid subjects for selected class
  const getValidSubjectsForClass = (classId) => {
    if (!classId || classId === 'all') return subjects?.data || []
    return (subjects?.data || []).filter(subject => subject.classId === classId)
  }

  // Get valid classes for selected subject
  const getValidClassesForSubject = (subjectId) => {
    if (!subjectId || subjectId === 'all') return classes?.data || []
    const subject = subjects?.data?.find(s => s._id === subjectId)
    if (!subject) return classes?.data || []
    return (classes?.data || []).filter(cls => cls._id === subject.classId)
  }

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV()
    } else if (exportFormat === 'pdf') {
      exportToPDF()
    } else if (exportFormat === 'excel') {
      exportToExcel()
    }
  }

  const exportToCSV = () => {
    if (!grades || !Array.isArray(grades) || grades.length === 0) return

    const headers = includeDetails 
      ? ['Student Name', 'Class', 'Subject', 'Exam', 'Score', 'Max Score', 'Percentage', 'Grade', 'Status', 'Date', 'Comments']
      : ['Student Name', 'Class', 'Subject', 'Exam', 'Score', 'Percentage', 'Grade', 'Status']

    const rows = grades.map(grade => {
      const baseRow = [
        grade.studentName,
        grade.className,
        grade.subjectName,
        grade.examTitle,
        grade.score,
        grade.maxScore,
        `${grade.percentage}%`,
        grade.grade,
        grade.status
      ]

      if (includeDetails) {
        return [
          ...baseRow,
          new Date(grade.date).toLocaleDateString(),
          includeComments ? (grade.comments || '') : ''
        ]
      }

      return baseRow
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    downloadFile(csvContent, `grades-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const exportToPDF = () => {
    const pdfContent = generatePDFContent()
    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grades-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    exportToCSV()
  }

  const generatePDFContent = () => {
    if (!grades || !Array.isArray(grades) || grades.length === 0) return ''

    const tableRows = grades.map(grade => `
      <tr>
        <td>${grade.studentName}</td>
        <td>${grade.className}</td>
        <td>${grade.subjectName}</td>
        <td>${grade.examTitle}</td>
        <td>${grade.score}/${grade.maxScore}</td>
        <td>${grade.percentage}%</td>
        <td>${grade.grade}</td>
        <td>${grade.status}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grades Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { margin-bottom: 20px; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Grades Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Grades: ${grades.length}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p>Class: ${selectedClass !== 'all' ? classes?.find(c => c._id === selectedClass)?.name : 'All Classes'}</p>
            <p>Subject: ${selectedSubject !== 'all' ? subjects?.find(s => s._id === selectedSubject)?.name : 'All Subjects'}</p>
            <p>Exam: ${selectedExam !== 'all' ? exams?.find(e => e._id === selectedExam)?.title : 'All Exams'}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600 bg-gray-100'
    
    switch (status.toLowerCase()) {
      case 'passed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'incomplete': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-600 bg-gray-100'
    
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-100'
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C+':
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (percentage) => {
    if (!percentage || isNaN(percentage)) return 'text-gray-600'
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Export Grades</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Export student grades in various formats with detailed filtering
          </p>
        </div>
      </div>

      {/* Export Configuration */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Configuration</h3>
        
        {/* Selection Guide */}
        {(!selectedClass || selectedClass === 'all' || !selectedSubject || selectedSubject === 'all') && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-xs sm:text-sm">
              <strong>Note:</strong> Please select both a class and subject to view grades. The teacher grades endpoint requires both selections.
            </p>
          </div>
        )}

        {/* Authorization Error */}
        {gradesError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-xs sm:text-sm">
              <strong>Access Denied:</strong> You are not authorized to view grades for this subject-class combination. 
              This usually means the subject is not assigned to the selected class, or you don't have permission to access this data.
            </p>
            <p className="text-red-700 text-xs mt-1">
              Please select a different class or subject combination.
            </p>
          </div>
        )}

        {/* Invalid Combination Warning */}
        {selectedClass !== 'all' && selectedSubject !== 'all' && !isSubjectAssignedToClass(selectedSubject, selectedClass) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-xs sm:text-sm">
              <strong>Warning:</strong> The selected subject is not assigned to the selected class. 
              This combination will result in an access denied error.
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              Please select a valid subject-class combination to view grades.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                // Reset subject if the new class doesn't support the current subject
                if (e.target.value !== 'all' && selectedSubject !== 'all') {
                  const validSubjects = getValidSubjectsForClass(e.target.value)
                  if (!validSubjects.find(s => s._id === selectedSubject)) {
                    setSelectedSubject('all')
                  }
                }
              }}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Classes</option>
              {classes?.data?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                // Reset class if the new subject doesn't support the current class
                if (e.target.value !== 'all' && selectedClass !== 'all') {
                  const validClasses = getValidClassesForSubject(e.target.value)
                  if (!validClasses.find(c => c._id === selectedClass)) {
                    setSelectedClass('all')
                  }
                }
              }}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Subjects</option>
              {getValidSubjectsForClass(selectedClass).map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam Type
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Terms</option>
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="final">Final</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Include detailed information</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeComments}
              onChange={(e) => setIncludeComments(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Include comments</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">Preview</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email Report</span>
            <span className="sm:hidden">Email</span>
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Grades</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </Card>

      {/* Grades Summary */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Grades Summary</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {grades?.length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Grades</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {grades?.filter(g => g.status === 'passed').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Passed</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {grades?.filter(g => g.status === 'failed').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
              {grades?.length > 0 
                ? (grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length).toFixed(1)
                : 0
              }%
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</div>
          </div>
        </div>

        {/* Grades Table */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : grades?.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No grades found for the selected criteria</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {grades?.map((grade, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{grade?.studentName || 'N/A'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{grade?.className || 'N/A'} - {grade?.subjectName || 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grade?.status)}`}>
                      {grade?.status || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Exam:</span>
                      <span className="ml-1">{grade?.examTitle || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Score:</span>
                      <span className="ml-1">{grade?.score || 0}/{grade?.maxScore || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                      <span className={`ml-1 font-medium ${getScoreColor(grade?.percentage)}`}>
                        {grade?.percentage || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade?.grade)}`}>
                        {grade?.grade || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Date: {grade?.date ? new Date(grade.date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="text-left px-4 py-2">Student</th>
                    <th className="text-left px-4 py-2">Class</th>
                    <th className="text-left px-4 py-2">Subject</th>
                    <th className="text-left px-4 py-2">Exam</th>
                    <th className="text-left px-4 py-2">Score</th>
                    <th className="text-left px-4 py-2">Percentage</th>
                    <th className="text-left px-4 py-2">Grade</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grades?.map((grade, index) => (
                    <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium">{grade?.studentName || 'N/A'}</td>
                      <td className="px-4 py-2">{grade?.className || 'N/A'}</td>
                      <td className="px-4 py-2">{grade?.subjectName || 'N/A'}</td>
                      <td className="px-4 py-2">{grade?.examTitle || 'N/A'}</td>
                      <td className="px-4 py-2">{grade?.score || 0}/{grade?.maxScore || 0}</td>
                      <td className={`px-4 py-2 font-medium ${getScoreColor(grade?.percentage)}`}>
                        {grade?.percentage || 0}%
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade?.grade)}`}>
                          {grade?.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grade?.status)}`}>
                          {grade?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {grade?.date ? new Date(grade.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Grades Preview"
        size="xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Preview of {previewData?.length || 0} grades that will be exported
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden max-h-96 overflow-y-auto space-y-3">
            {previewData?.slice(0, 10).map((grade, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{grade?.studentName || 'N/A'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{grade?.className || 'N/A'} - {grade?.subjectName || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grade?.status)}`}>
                    {grade?.status || 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Score:</span>
                    <span className="ml-1">{grade?.score || 0}/{grade?.maxScore || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade?.grade)}`}>
                      {grade?.grade || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">Class</th>
                  <th className="text-left px-4 py-2">Subject</th>
                  <th className="text-left px-4 py-2">Score</th>
                  <th className="text-left px-4 py-2">Grade</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData?.slice(0, 10).map((grade, index) => (
                  <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2">{grade?.studentName || 'N/A'}</td>
                    <td className="px-4 py-2">{grade?.className || 'N/A'}</td>
                    <td className="px-4 py-2">{grade?.subjectName || 'N/A'}</td>
                    <td className="px-4 py-2">{grade?.score || 0}/{grade?.maxScore || 0}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade?.grade)}`}>
                        {grade?.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grade?.status)}`}>
                        {grade?.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {previewData?.length > 10 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Showing first 10 grades of {previewData.length} total grades
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPreviewModal(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowPreviewModal(false)
                handleExport()
              }}
              className="w-full sm:w-auto"
            >
              Export Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Report Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Grades Report"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Send grades report via email to parents/guardians
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                defaultValue="Student Grades Report"
                className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Message
              </label>
              <textarea
                rows={4}
                defaultValue="Please find attached the grades report for your child. If you have any questions, please don't hesitate to contact us."
                className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Include Grades
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Individual student grades</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Class performance summary</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Recommendations for improvement</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowEmailModal(false)
                alert('Email report sent successfully!')
              }}
              className="w-full sm:w-auto"
            >
              Send Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



