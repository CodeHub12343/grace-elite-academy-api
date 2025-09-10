import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, classesApi, studentsApi, teacherAttendanceApi, teachersApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Minus, 
  Save, 
  Download, 
  Upload, 
  Filter, 
  BarChart3, 
  FileText,
  Edit,
  Eye,
  Plus,
  X,
  AlertCircle,
  Clock
} from 'lucide-react'

export function AttendancePage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [classId, setClassId] = useState('')
  const [viewMode, setViewMode] = useState('marking') // marking, reports, bulk
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [bulkStatus, setBulkStatus] = useState('present')
  const [attendanceRows, setAttendanceRows] = useState([])
  const [isMarking, setIsMarking] = useState(false)
  const [teacherTab, setTeacherTab] = useState('list') // list | mark | bulk
  const [teacherFilters, setTeacherFilters] = useState({ teacherId: '', status: '', date: '', startDate: '', endDate: '' })
  const [bulkTeacherDate, setBulkTeacherDate] = useState('')
  const [bulkTeacherRecords, setBulkTeacherRecords] = useState([{ teacherId: '', status: 'present', remarks: '' }])

  // Queries
  const { data: classesData } = useQuery({
    queryKey: ['classes','all'],
    queryFn: () => classesApi.getClasses({ limit: 1000 }),
  })

  // Admin: Teacher Attendance listing
  const { data: teacherAttData, isFetching: teacherAttLoading, refetch: refetchTeacherAtt } = useQuery({
    queryKey: ['teacher-attendance', teacherFilters],
    queryFn: () => teacherAttendanceApi.list(teacherFilters),
    enabled: false,
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: () => classId ? studentsApi.getStudents({ classId, limit: 1000 }) : null,
    enabled: !!classId
  })

  const { data: summaryData, refetch: refetchSummary, isFetching: loadingSummary } = useQuery({
    queryKey: ['attendance','summary', classId, startDate, endDate],
    queryFn: () => attendanceApi.getAttendanceReport({ classId, startDate, endDate }),
    enabled: false,
    onError: (error) => {
      try { window?.toast?.error?.(error?.message || 'Failed to load summary') } catch {
        // Ignore toast errors
      }
      console.error('Failed to load attendance summary:', error)
    },
    onSuccess: () => {
      try { window?.toast?.success?.('Summary loaded') } catch {
        // Ignore toast errors
      }
    }
  })

  const { data: classAttendance, refetch: refetchClass, isFetching: loadingClass } = useQuery({
    queryKey: ['attendance','class', classId, date],
    queryFn: () => attendanceApi.getClassAttendance(classId, { startDate: date, endDate: date }),
    enabled: !!classId && !!date,
    onError: (error) => {
      try { window?.toast?.error?.(error?.message || 'Failed to load day records') } catch {
        // Ignore toast errors
      }
      console.error('Failed to load class day records:', error)
    },
    onSuccess: () => {
      try { window?.toast?.success?.('Day records loaded') } catch {
        // Ignore toast errors
      }
    }
  })

  // Mutations
  const bulkAttendanceMutation = useMutation({
    mutationFn: (data) => attendanceApi.markBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      setShowBulkModal(false)
      window?.toast?.success?.('Attendance marked successfully!')
    },
    onError: (error) => {
      window?.toast?.error?.('Failed to mark attendance. Please try again.')
      console.error('Attendance marking failed:', error)
    }
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: () => {
      if (!selectedAttendance) return Promise.resolve()
      const payload = {
        classId,
        date,
        records: [
          {
            studentId: selectedAttendance.studentId?._id || selectedAttendance.studentId,
            status: selectedAttendance.status,
            remarks: selectedAttendance.remarks || ''
          }
        ]
      }
      return attendanceApi.updateAttendance(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      setShowEditModal(false)
      setSelectedAttendance(null)
      window?.toast?.success?.('Attendance updated successfully!')
    },
    onError: (error) => {
      window?.toast?.error?.('Failed to update attendance. Please try again.')
      console.error('Attendance update failed:', error)
    }
  })

  // Initialize attendance rows when students or existing attendance changes
  useEffect(() => {
    if (studentsData?.data && classAttendance?.data) {
      const initialRows = studentsData.data.map(student => {
        const existing = classAttendance.data.find(a => a.studentId === student._id)
        return {
          studentId: student._id,
          studentName: student.userId?.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          status: existing?.status || 'present',
          remarks: existing?.remarks || '',
          attendanceId: existing?._id || null
        }
      })
      setAttendanceRows(initialRows)
    } else if (studentsData?.data && !classAttendance?.data) {
      // No existing attendance, create default rows
      const defaultRows = studentsData.data.map(student => ({
        studentId: student._id,
        studentName: student.userId?.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        status: 'present',
        remarks: '',
        attendanceId: null
      }))
      setAttendanceRows(defaultRows)
    }
  }, [studentsData, classAttendance])

  const handleBulkMark = async () => {
    if (!classId || !date || attendanceRows.length === 0) return

    setIsMarking(true)
    try {
      const attendanceData = {
        classId,
        date,
        records: attendanceRows.map(row => ({
          studentId: row.studentId,
          status: bulkStatus,
          remarks: ''
        }))
      }

      await bulkAttendanceMutation.mutateAsync(attendanceData)
    } finally {
      setIsMarking(false)
    }
  }

  const handleSaveAttendance = async () => {
    if (!classId || !date || attendanceRows.length === 0) return

    setIsMarking(true)
    try {
      const attendanceData = {
        classId,
        date,
        records: attendanceRows.map(row => ({
          studentId: row.studentId,
          status: row.status,
          remarks: row.remarks
        }))
      }

      await bulkAttendanceMutation.mutateAsync(attendanceData)
    } finally {
      setIsMarking(false)
    }
  }

  const handleEditAttendance = (attendance) => {
    setSelectedAttendance(attendance)
    setShowEditModal(true)
  }

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance) return

    await updateAttendanceMutation.mutateAsync()
  }

  const updateRow = (index, field, value) => {
    const newRows = [...attendanceRows]
    newRows[index][field] = value
    setAttendanceRows(newRows)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200'
      case 'absent': return 'bg-red-100 text-red-800 border-red-200'
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const exportAttendance = (format = 'csv') => {
    if (!attendanceRows.length) return

    let content = ''
    const headers = ['Student Name', 'Status', 'Remarks', 'Date', 'Class']
    
    if (format === 'csv') {
      content = headers.join(',') + '\n'
      attendanceRows.forEach(row => {
        const className = classesData?.data?.find(c => c._id === classId)?.name || 'Unknown'
        content += `"${row.studentName}","${row.status}","${row.remarks}","${date}","${className}"\n`
      })
      
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${classId}_${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      try { window?.toast?.success?.('Attendance exported') } catch {
        // Ignore toast errors
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Mark, edit, and export student attendance records</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => exportAttendance('csv')}
            disabled={!attendanceRows.length}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'marking', label: 'Mark Attendance', shortLabel: 'Mark', icon: Calendar },
          { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
          { id: 'bulk', label: 'Bulk Operations', shortLabel: 'Bulk', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Attendance Marking Interface */}
      {viewMode === 'marking' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select a class</option>
                  {classesData?.data?.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={() => refetchClass()}
                  variant="outline"
                  disabled={!classId || !date}
                  className="flex items-center justify-center space-x-2 text-sm"
                >
                  <Filter className="h-4 w-4" />
                  <span>Load</span>
                </Button>
                
                <Button
                  onClick={handleSaveAttendance}
                  disabled={!classId || !date || attendanceRows.length === 0 || isMarking}
                  className="flex items-center justify-center space-x-2 text-sm"
                >
                  {isMarking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save All</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Attendance Table */}
          {attendanceRows.length > 0 && (
            <Card className="p-0">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  Mark Attendance for {date}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {attendanceRows.length} students in class
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Student</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Remarks</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {attendanceRows.map((row, index) => (
                      <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {row.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(index, 'status', e.target.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(row.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => updateRow(index, 'remarks', e.target.value)}
                            placeholder="Optional remarks"
                            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {row.attendanceId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAttendance({
                                _id: row.attendanceId,
                                status: row.status,
                                remarks: row.remarks
                              })}
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                <div className="space-y-4 p-4">
                  {attendanceRows.map((row, index) => (
                    <div key={row.studentId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {row.studentName}
                          </div>
                        </div>
                        {row.attendanceId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAttendance({
                              _id: row.attendanceId,
                              status: row.status,
                              remarks: row.remarks
                            })}
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Status
                          </label>
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(index, 'status', e.target.value)}
                            className={`w-full px-3 py-2 text-sm font-medium rounded-md border ${getStatusColor(row.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Remarks
                          </label>
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => updateRow(index, 'remarks', e.target.value)}
                            placeholder="Optional remarks"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Bulk Operations */}
      {viewMode === 'bulk' && (
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Bulk Attendance Operations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select a class</option>
                  {classesData?.data?.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  onClick={() => setShowBulkModal(true)}
                  disabled={!classId || !date || !studentsData?.data?.length}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Mark
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">Bulk Operations Available</h4>
              <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Mark all students as present/absent/late/excused</li>
                <li>• Apply to entire class on specific date</li>
                <li>• Override existing attendance records</li>
                <li>• Quick setup for new attendance periods</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* Reports Interface */}
      {viewMode === 'reports' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Teacher Attendance */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="text-base sm:text-lg font-medium">Teacher Attendance</div>
              <div className="flex flex-wrap gap-2">
                {['list','mark','bulk'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded border text-sm ${teacherTab===t?'bg-gray-100 dark:bg-gray-800':''}`} onClick={() => setTeacherTab(t)}>{t.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {teacherTab === 'list' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                  <input placeholder="Teacher ID" className="px-2 py-1 rounded border text-sm" value={teacherFilters.teacherId} onChange={(e)=>setTeacherFilters({...teacherFilters, teacherId:e.target.value})} />
                  <select className="px-2 py-1 rounded border text-sm" value={teacherFilters.status} onChange={(e)=>setTeacherFilters({...teacherFilters, status:e.target.value})}>
                    <option value="">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                  <input type="date" className="px-2 py-1 rounded border text-sm" value={teacherFilters.date} onChange={(e)=>setTeacherFilters({...teacherFilters, date:e.target.value})} />
                  <input type="date" className="px-2 py-1 rounded border text-sm" value={teacherFilters.startDate} onChange={(e)=>setTeacherFilters({...teacherFilters, startDate:e.target.value})} />
                  <input type="date" className="px-2 py-1 rounded border text-sm" value={teacherFilters.endDate} onChange={(e)=>setTeacherFilters({...teacherFilters, endDate:e.target.value})} />
                  <Button onClick={()=>refetchTeacherAtt()} disabled={teacherAttLoading} className="text-sm">{teacherAttLoading?'Loading...':'Apply'}</Button>
                </div>

                <div className="overflow-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Teacher</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Remarks</th>
                        <th className="text-left px-3 py-2">Marked By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teacherAttData?.data||[]).length? (teacherAttData.data).map(r => (
                        <tr key={r._id} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2">{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                          <td className="px-3 py-2">{r.teacherId?.userId?.name || r.teacherId?._id}</td>
                          <td className="px-3 py-2 capitalize">{r.status}</td>
                          <td className="px-3 py-2">{r.remarks||'-'}</td>
                          <td className="px-3 py-2">{r.markedBy?.name || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">No records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {teacherTab === 'mark' && (
              <TeacherMarkForm />
            )}

            {teacherTab === 'bulk' && (
              <TeacherBulkForm
                date={bulkTeacherDate}
                setDate={setBulkTeacherDate}
                records={bulkTeacherRecords}
                setRecords={setBulkTeacherRecords}
              />
            )}
          </Card>
          {/* Existing Reports Code */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="px-3 py-2 rounded-md border text-sm">
              <option value="">Select class</option>
              {(classesData?.data || []).map(c => (
                <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="text-sm">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" />
              <Button variant="outline" onClick={() => classId && refetchClass()} disabled={!classId || loadingClass} className="text-sm">
                {loadingClass ? 'Loading...' : 'Load Day Records'}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="text-sm">Range</label>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-md border text-sm" />
                <span>-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-md border text-sm" />
              </div>
              <Button onClick={() => classId && refetchSummary()} disabled={!classId || loadingSummary} className="text-sm">
                {loadingSummary ? 'Loading...' : 'Load Summary'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm font-medium mb-2">Summary (by student)</div>
            {summaryData?.data?.length ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="text-left px-4 py-2">Student</th>
                      <th className="text-left px-4 py-2">Sessions</th>
                      <th className="text-left px-4 py-2">Present</th>
                      <th className="text-left px-4 py-2">Absent</th>
                      <th className="text-left px-4 py-2">Late</th>
                      <th className="text-left px-4 py-2">Excused</th>
                      <th className="text-left px-4 py-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.data.map((row) => (
                      <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2">{row._id}</td>
                        <td className="px-4 py-2">{row.totalSessions}</td>
                        <td className="px-4 py-2">{row.present}</td>
                        <td className="px-4 py-2">{row.absent}</td>
                        <td className="px-4 py-2">{row.late}</td>
                        <td className="px-4 py-2">{row.excused}</td>
                        <td className="px-4 py-2">{Math.round(row.percentage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Load summary to view results.</div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm font-medium mb-2">Day Records</div>
            {classAttendance?.data?.length ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="text-left px-4 py-2">Student</th>
                      <th className="text-left px-4 py-2">Status</th>
                      <th className="text-left px-4 py-2">Remarks</th>
                      <th className="text-left px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAttendance.data.map((row) => (
                      <tr key={row._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2">{row.studentId?.userId?.name || row.studentId?._id}</td>
                        <td className="px-4 py-2">{row.status}</td>
                        <td className="px-4 py-2">{row.remarks}</td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAttendance(row)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Select class and date to view daily records.</div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Marking Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Attendance Marking"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mark all students as:
            </label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This will mark all {studentsData?.data?.length || 0} students as <strong>{bulkStatus}</strong> for {date}.
              <br />
              <strong>Warning:</strong> This will override any existing attendance records for this date.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkMark}
              disabled={bulkAttendanceMutation.isPending || isMarking}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              {bulkAttendanceMutation.isPending || isMarking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Marking...</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>Mark All</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Attendance Record"
        size="md"
      >
        {selectedAttendance && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attendance Details</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Class:</strong> {classesData?.data?.find(c => c._id === classId)?.name || 'Unknown'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedAttendance.status}
                onChange={(e) => setSelectedAttendance(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks
              </label>
              <textarea
                rows={3}
                value={selectedAttendance.remarks}
                onChange={(e) => setSelectedAttendance(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Optional remarks..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAttendance}
                disabled={updateAttendanceMutation.isPending}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                {updateAttendanceMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AttendancePage

function TeacherMarkForm() {
  const [teacherId, setTeacherId] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('present')
  const [remarks, setRemarks] = useState('')
  const qc = useQueryClient()
  
  // Fetch teachers for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ['teachers','all'],
    queryFn: () => teachersApi.getTeachers({ limit: 1000 }),
  })
  
  const mutation = useMutation({
    mutationFn: (payload) => teacherAttendanceApi.mark(payload),
    onSuccess: () => {
      try { window?.toast?.success?.('Marked') } catch {
        // Ignore toast errors
      }
      qc.invalidateQueries({ queryKey: ['teacher-attendance'] })
    },
  })
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <select 
          className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
          value={teacherId} 
          onChange={(e)=>setTeacherId(e.target.value)}
        >
          <option value="">Select Teacher</option>
          {teachersData?.data?.map(teacher => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.userId?.name || teacher.name || `Teacher ${teacher._id.slice(-4)}`}
            </option>
          ))}
        </select>
        <input 
          type="date" 
          className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
          value={date} 
          onChange={(e)=>setDate(e.target.value)} 
        />
        <select 
          className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
          value={status} 
          onChange={(e)=>setStatus(e.target.value)}
        >
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="excused">Excused</option>
        </select>
        <input 
          className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
          placeholder="Remarks" 
          value={remarks} 
          onChange={(e)=>setRemarks(e.target.value)} 
        />
        <Button 
          onClick={()=> teacherId && mutation.mutate({ teacherId, date, status, remarks })} 
          disabled={!teacherId || mutation.isPending} 
          className="text-sm"
        >
          {mutation.isPending?'Saving...':'Mark'}
        </Button>
      </div>
    </div>
  )
}

function TeacherBulkForm({ date, setDate, records, setRecords }) {
  const qc = useQueryClient()
  
  // Fetch teachers for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ['teachers','all'],
    queryFn: () => teachersApi.getTeachers({ limit: 1000 }),
  })
  
  const mutation = useMutation({
    mutationFn: (payload) => teacherAttendanceApi.bulk(payload),
    onSuccess: () => {
      try { window?.toast?.success?.('Bulk saved') } catch {
        // Ignore toast errors
      }
      qc.invalidateQueries({ queryKey: ['teacher-attendance'] })
    },
  })
  
  const update = (idx, field, value) => {
    const next = [...records];
    next[idx] = { ...next[idx], [field]: value };
    setRecords(next)
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input 
          type="date" 
          className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
          value={date} 
          onChange={(e)=>setDate(e.target.value)} 
        />
        <div className="sm:col-span-1 lg:col-span-4" />
      </div>
      <div className="space-y-2">
        {records.map((r, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select 
              className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
              value={r.teacherId} 
              onChange={(e)=>update(idx,'teacherId',e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachersData?.data?.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.userId?.name || teacher.name || `Teacher ${teacher._id.slice(-4)}`}
                </option>
              ))}
            </select>
            <select 
              className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
              value={r.status} 
              onChange={(e)=>update(idx,'status',e.target.value)}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <input 
              className="px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
              placeholder="Remarks" 
              value={r.remarks||''} 
              onChange={(e)=>update(idx,'remarks',e.target.value)} 
            />
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={()=> setRecords(records.filter((_,i)=>i!==idx))} 
                className="text-sm"
              >
                Remove
              </Button>
              {idx === records.length - 1 && (
                <Button 
                  variant="secondary" 
                  onClick={()=> setRecords([...records, { teacherId: '', status: 'present', remarks: '' }])} 
                  className="text-sm"
                >
                  Add Row
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div>
        <Button 
          onClick={()=> mutation.mutate({ date, records })} 
          disabled={mutation.isPending || !records.length} 
          className="text-sm"
        >
          {mutation.isPending?'Saving...':'Save Bulk'}
        </Button>
      </div>
    </div>
  )
}






