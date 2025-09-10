import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, BarChart3, Users, Calendar, Filter, Settings, Eye } from 'lucide-react'
import { api } from '../../../lib/axios'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'

export default function ResultExportPage() {
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedClass, setSelectedClass] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [exportFormat, setExportFormat] = useState('csv')
  const [includeDetails, setIncludeDetails] = useState(true)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  // Fetch exam results data
  const { data: results, isLoading } = useQuery({
    queryKey: ['exam-results', selectedExam, selectedClass, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedExam !== 'all') params.append('examId', selectedExam)
      if (selectedClass !== 'all') params.append('classId', selectedClass)
      if (dateRange !== 'all') params.append('dateRange', dateRange)
      
      const response = await api.get(`/exams/results?${params.toString()}`)
      return response.data
    }
  })

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

  const handlePreview = () => {
    setPreviewData(results)
    setShowPreviewModal(true)
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
    if (!results) return

    const headers = includeDetails 
      ? ['Student Name', 'Class', 'Exam', 'Score', 'Percentage', 'Time Taken', 'Status', 'Date', 'Questions Attempted', 'Correct Answers', 'Incorrect Answers']
      : ['Student Name', 'Class', 'Exam', 'Score', 'Percentage', 'Status', 'Date']

    const rows = results.map(result => {
      const baseRow = [
        result.studentName,
        result.className,
        result.examTitle,
        result.score,
        `${result.percentage}%`,
        result.status,
        new Date(result.submittedAt).toLocaleDateString()
      ]

      if (includeDetails) {
        return [
          ...baseRow,
          result.timeTaken,
          result.questionsAttempted,
          result.correctAnswers,
          result.incorrectAnswers
        ]
      }

      return baseRow
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    downloadFile(csvContent, `exam-results-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const exportToPDF = () => {
    // This would typically use a PDF library like jsPDF
    // For now, we'll create a simple HTML-based PDF
    const pdfContent = generatePDFContent()
    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exam-results-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    // This would typically use a library like SheetJS
    // For now, we'll create a CSV that Excel can open
    exportToCSV()
  }

  const generatePDFContent = () => {
    if (!results) return ''

    const tableRows = results.map(result => `
      <tr>
        <td>${result.studentName}</td>
        <td>${result.className}</td>
        <td>${result.examTitle}</td>
        <td>${result.score}</td>
        <td>${result.percentage}%</td>
        <td>${result.status}</td>
        <td>${new Date(result.submittedAt).toLocaleDateString()}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exam Results Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Results: ${results.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Date</th>
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
    switch (status.toLowerCase()) {
      case 'passed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'incomplete': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Export Results</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Export exam results in various formats with detailed filtering
          </p>
        </div>
      </div>

      {/* Export Configuration */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
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
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
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
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

        <div className="flex items-center space-x-4 mb-4 sm:mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Include detailed information</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Results</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Results Summary</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {results?.length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Results</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {results?.filter(r => r.status === 'passed').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Passed</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {results?.filter(r => r.status === 'failed').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
              {results?.length > 0 
                ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
                : 0
              }%
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Score</div>
          </div>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : results?.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No results found for the selected criteria</p>
          </div>
        ) : (
          <div>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {results?.map((result, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {result.studentName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Class:</span>
                      <span className="font-medium">{result.className}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Exam:</span>
                      <span className="font-medium truncate ml-2">{result.examTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Score:</span>
                      <span className="font-medium">{result.score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Percentage:</span>
                      <span className={`font-medium ${getScoreColor(result.percentage)}`}>
                        {result.percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(result.submittedAt).toLocaleDateString()}</span>
                    </div>
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
                    <th className="text-left px-4 py-2">Exam</th>
                    <th className="text-left px-4 py-2">Score</th>
                    <th className="text-left px-4 py-2">Percentage</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.map((result, index) => (
                    <tr key={index} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 font-medium">{result.studentName}</td>
                      <td className="px-4 py-2">{result.className}</td>
                      <td className="px-4 py-2">{result.examTitle}</td>
                      <td className="px-4 py-2">{result.score}</td>
                      <td className={`px-4 py-2 font-medium ${getScoreColor(result.percentage)}`}>
                        {result.percentage}%
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Results Preview"
        size="xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Preview of {previewData?.length || 0} results that will be exported
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">Class</th>
                  <th className="text-left px-4 py-2">Exam</th>
                  <th className="text-left px-4 py-2">Score</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData?.slice(0, 10).map((result, index) => (
                  <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2">{result.studentName}</td>
                    <td className="px-4 py-2">{result.className}</td>
                    <td className="px-4 py-2">{result.examTitle}</td>
                    <td className="px-4 py-2">{result.score}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {previewData?.length > 10 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Showing first 10 results of {previewData.length} total results
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
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
    </div>
  )
}





