import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, BarChart3, Users, Calendar, Filter, Settings, Eye, Mail, Printer } from 'lucide-react'
import { attendanceApi } from '../../../lib/api'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { api } from '../../../lib/axios'

export default function AttendanceReportsPage() {
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('summary') // 'summary', 'detailed', 'individual', 'comparison'
  const [exportFormat, setExportFormat] = useState('csv')
  const [includeDetails, setIncludeDetails] = useState(true)
  const [includeComments, setIncludeComments] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Fetch attendance data for reports
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-reports', selectedClass, selectedStudent, dateRange, startDate, endDate],
    queryFn: async () => {
      const params = {}
      if (selectedClass !== 'all') params.classId = selectedClass
      if (selectedStudent !== 'all') params.studentId = selectedStudent
      if (dateRange !== 'custom') {
        if (dateRange !== 'all') params.days = dateRange
      } else {
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
      }
      return attendanceApi.getAttendanceReport(params)
    }
  })

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes', { params: { scope: 'mine' } })
      return response.data
    }
  })

  const classesList = Array.isArray(classes?.data) ? classes.data : (Array.isArray(classes) ? classes : [])

  // Fetch students for selected class
  const { data: students } = useQuery({
    queryKey: ['students', 'class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return []
      const response = await api.get(`/classes/${selectedClass}/students`)
      return response.data
    },
    enabled: !!selectedClass
  })

  const handlePreview = () => {
    setPreviewData(attendanceData)
    setShowPreviewModal(true)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass !== 'all') params.append('classId', selectedClass)
      if (selectedStudent !== 'all') params.append('studentId', selectedStudent)
      if (dateRange !== 'custom') {
        if (dateRange !== 'all') params.append('days', dateRange)
      } else {
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
      }
      params.append('reportType', reportType)
      params.append('format', exportFormat)
      params.append('includeDetails', includeDetails)
      params.append('includeComments', includeComments)

      const res = await fetch(`/attendance/export?${params.toString()}`)
      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleEmailReport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass !== 'all') params.append('classId', selectedClass)
      if (selectedStudent !== 'all') params.append('studentId', selectedStudent)
      if (dateRange !== 'custom') {
        if (dateRange !== 'all') params.append('days', dateRange)
      } else {
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
      }
      params.append('reportType', reportType)
      params.append('format', exportFormat)
      params.append('includeDetails', includeDetails)
      params.append('includeComments', includeComments)

      await api.post('/attendance/email-report', {
        recipients: emailRecipients.split(',').map(email => email.trim()),
        subject: emailSubject,
        message: emailMessage,
        params: params.toString()
      })

      setShowEmailModal(false)
      setEmailRecipients('')
      setEmailSubject('')
      setEmailMessage('')
    } catch (error) {
      console.error('Email report failed:', error)
    }
  }

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Attendance Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="summary">
              <h2>Summary</h2>
              <p>Class: ${selectedClass === 'all' ? 'All Classes' : (classesList.find(c => c._id === selectedClass)?.name || '')}</p>
              <p>Period: ${dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Excused</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceData?.students?.map(student => `
                  <tr>
                    <td>${student.name}</td>
                    <td>${student.present}</td>
                    <td>${student.absent}</td>
                    <td>${student.late}</td>
                    <td>${student.excused}</td>
                    <td>${student.attendanceRate}%</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Attendance Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Generate comprehensive attendance reports and export data
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handlePreview}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">Preview</span>
          </Button>
          
          <Button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          
          <Button
            onClick={handlePrintReport}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Classes</option>
              {classesList.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Students</option>
              {students?.map(student => (
                <option key={student._id} value={student._id}>{student.name}</option>
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
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="custom">Custom Range</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="individual">Individual Report</option>
              <option value="comparison">Comparison Report</option>
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
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeDetails"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="includeDetails" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Details
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeComments"
              checked={includeComments}
              onChange={(e) => setIncludeComments(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="includeComments" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Comments
            </label>
          </div>
        </div>
      </Card>

      {/* Report Summary */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Summary</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {attendanceData?.summary?.totalStudents || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Students</p>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {attendanceData?.summary?.averageAttendance?.toFixed(1) || 0}%
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Attendance</p>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {attendanceData?.summary?.totalDays || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Days</p>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {attendanceData?.summary?.reportPeriod || 'N/A'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Report Period</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowEmailModal(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email Report</span>
            <span className="sm:hidden">Email</span>
          </Button>
          
          <Button
            onClick={handlePrintReport}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Report</span>
            <span className="sm:hidden">Print</span>
          </Button>
          
          <Button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download {exportFormat.toUpperCase()}</span>
            <span className="sm:hidden">Download</span>
          </Button>
        </div>
      </Card>

      {/* Sample Data Preview */}
      {attendanceData?.students && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Sample Data Preview</h3>
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {attendanceData.students.slice(0, 10).map((student, index) => (
              <div key={student._id || index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {student.name}
                  </h4>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {student.attendanceRate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="font-semibold text-green-600 dark:text-green-400">{student.present}</div>
                    <div className="text-gray-500 dark:text-gray-400">Present</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="font-semibold text-red-600 dark:text-red-400">{student.absent}</div>
                    <div className="text-gray-500 dark:text-gray-400">Absent</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="font-semibold text-yellow-600 dark:text-yellow-400">{student.late}</div>
                    <div className="text-gray-500 dark:text-gray-400">Late</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">{student.excused}</div>
                    <div className="text-gray-500 dark:text-gray-400">Excused</div>
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
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Excused
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceData.students.slice(0, 10).map((student, index) => (
                  <tr key={student._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.present}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.absent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.late}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.excused}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.attendanceRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {attendanceData.students.length > 10 && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
              Showing first 10 students. Full data will be included in the exported report.
            </p>
          )}
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Report Preview"
        size="4xl"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Report Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">Class:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedClass === 'all' ? 'All Classes' : (classesList.find(c => c._id === selectedClass)?.name || '')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Period:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{reportType}</span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-2 text-gray-900 dark:text-white uppercase">{exportFormat}</span>
              </div>
            </div>
          </div>
          
          {previewData && (
            <div className="max-h-64 sm:max-h-96 overflow-y-auto">
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Report"
        size="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Attendance Report"
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={4}
              placeholder="Please find attached the attendance report..."
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleEmailReport} className="w-full sm:w-auto">
              Send Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



