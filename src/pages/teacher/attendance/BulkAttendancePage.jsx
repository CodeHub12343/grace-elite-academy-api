import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Users, CheckCircle, XCircle, Minus, Save, Download, Upload, Filter } from 'lucide-react'
import { attendanceApi } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Modal } from '../../../components/ui/Modal'

export default function BulkAttendancePage() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceData, setAttendanceData] = useState([])
  const [markingMode, setMarkingMode] = useState('individual') // 'individual', 'bulk', 'pattern'
  const [bulkStatus, setBulkStatus] = useState('present') // 'present', 'absent', 'late', 'excused'
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes', { params: { scope: 'mine' } })
      return response.data
    }
  })

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

  // Fetch existing attendance for the selected date and class
  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass || !selectedDate) return []
      const response = await api.get(`/attendance?classId=${selectedClass}&date=${selectedDate}`)
      return response.data
    },
    enabled: !!selectedClass && !!selectedDate
  })

  // Initialize attendance data when students or existing attendance changes
  useEffect(() => {
    if (students && students.length > 0) {
      const initialData = students.map(student => {
        const existing = existingAttendance?.find(a => a.studentId === student._id)
        return {
          studentId: student._id,
          studentName: student.name,
          status: existing?.status || 'present',
          remarks: existing?.remarks || '',
          isMarked: !!existing
        }
      })
      setAttendanceData(initialData)
    }
  }, [students, existingAttendance])

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: (attendancePayload) => attendanceApi.markAttendance(attendancePayload),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      try { window?.toast?.success?.('Attendance saved') } catch (_) {}
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error('Failed to mark attendance:', error)
      alert('Failed to mark attendance. Please try again.')
      setIsSubmitting(false)
    }
  })

  const handleBulkMark = () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select class and date first')
      return
    }
    setShowBulkModal(true)
  }

  const applyBulkMarking = () => {
    const updatedData = attendanceData.map(item => ({
      ...item,
      status: bulkStatus,
      isMarked: true
    }))
    setAttendanceData(updatedData)
    setShowBulkModal(false)
  }

  const handleIndividualMark = (studentId, status) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.studentId === studentId 
          ? { ...item, status, isMarked: true }
          : item
      )
    )
  }

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.studentId === studentId 
          ? { ...item, remarks }
          : item
      )
    )
  }

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select class and date first')
      return
    }

    const markedAttendance = attendanceData.filter(item => item.isMarked)
    if (markedAttendance.length === 0) {
      alert('Please mark attendance for at least one student')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        classId: selectedClass,
        date: selectedDate,
        attendance: markedAttendance.map(item => ({
          studentId: item.studentId,
          status: item.status,
          remarks: item.remarks
        }))
      }

      await bulkAttendanceMutation.mutateAsync(payload)
    } catch (error) {
      console.error('Failed to submit attendance:', error)
    }
  }

  const downloadTemplate = () => {
    const headers = ['Student ID', 'Student Name', 'Status', 'Remarks']
    const rows = students?.map(student => [
      student._id,
      student.name,
      'present',
      ''
    ]) || []
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-template-${selectedDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100 border-green-200'
      case 'absent': return 'text-red-600 bg-red-100 border-red-200'
      case 'late': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'excused': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />
      case 'absent': return <XCircle className="h-4 w-4" />
      case 'late': return <Minus className="h-4 w-4" />
      case 'excused': return <Minus className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  const getAttendanceSummary = () => {
    const summary = {
      total: attendanceData.length,
      present: attendanceData.filter(item => item.status === 'present').length,
      absent: attendanceData.filter(item => item.status === 'absent').length,
      late: attendanceData.filter(item => item.status === 'late').length,
      excused: attendanceData.filter(item => item.status === 'excused').length,
      marked: attendanceData.filter(item => item.isMarked).length
    }
    return summary
  }

  const summary = getAttendanceSummary()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Bulk Attendance Marking</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Mark attendance for multiple students at once
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">Choose Class</option>
              {classes?.data?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              onClick={handleBulkMark}
              disabled={!selectedClass || !selectedDate}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Mark</span>
              <span className="sm:hidden">Bulk Mark</span>
            </Button>
          </div>
        </div>

        {/* Marking Mode Selection */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Marking Mode
          </label>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="individual"
                checked={markingMode === 'individual'}
                onChange={(e) => setMarkingMode(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Individual Marking</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="bulk"
                checked={markingMode === 'bulk'}
                onChange={(e) => setMarkingMode(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Bulk Operations</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.total}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Students</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.present}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Present</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.absent}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Absent</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {summary.late}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Late</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.excused}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Excused</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.marked}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Marked</div>
        </Card>
      </div>

      {/* Attendance Table */}
      {selectedClass && selectedDate && (
        <Card className="p-0">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Student Attendance ({attendanceData.length} students)
              </h3>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || summary.marked === 0}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="text-sm">Save Attendance</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden p-3 sm:p-4 space-y-3">
            {attendanceData.map((item, index) => (
              <div key={item.studentId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {item.studentName}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status}</span>
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={item.remarks}
                      onChange={(e) => handleRemarksChange(item.studentId, e.target.value)}
                      placeholder="Optional remarks"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mark Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleIndividualMark(item.studentId, 'present')}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          item.status === 'present'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-green-50'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleIndividualMark(item.studentId, 'absent')}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          item.status === 'absent'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-red-50'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleIndividualMark(item.studentId, 'late')}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          item.status === 'late'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-yellow-50'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleIndividualMark(item.studentId, 'excused')}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          item.status === 'excused'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-blue-50'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
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
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Remarks</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((item, index) => (
                  <tr key={item.studentId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{item.studentName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{item.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleRemarksChange(item.studentId, e.target.value)}
                        placeholder="Optional remarks"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleIndividualMark(item.studentId, 'present')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            item.status === 'present'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-green-50'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleIndividualMark(item.studentId, 'absent')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            item.status === 'absent'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-red-50'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleIndividualMark(item.studentId, 'late')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            item.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-yellow-50'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleIndividualMark(item.studentId, 'excused')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            item.status === 'excused'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-blue-50'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk Marking Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Attendance Marking"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Mark all students as the same status
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Status
            </label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              This will mark all {attendanceData.length} students as <strong>{bulkStatus}</strong>. 
              You can still modify individual students after applying.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={applyBulkMarking}
              className="w-full sm:w-auto"
            >
              Apply to All Students
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Attendance from CSV"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Upload a CSV file with attendance data. Make sure to use the template format.
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              <strong>CSV Format:</strong> Student ID, Student Name, Status, Remarks<br/>
              <strong>Status Options:</strong> present, absent, late, excused
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center">
            <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Drag and drop your CSV file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                // Handle file upload logic here
                console.log('File selected:', e.target.files[0])
              }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowImportModal(false)
                alert('CSV import functionality will be implemented here')
              }}
              className="w-full sm:w-auto"
            >
              Import CSV
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



