import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Users, CheckCircle, XCircle, Minus, Save, Download, Upload, Filter, BarChart3, FileText } from 'lucide-react'
import { attendanceApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Link } from 'react-router-dom'

export function AttendancePage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('present')

  // Navigation cards for Advanced Attendance Features
  const attendanceFeatures = [
    {
      title: 'Bulk Attendance Marking',
      description: 'Mark attendance for multiple students at once with bulk operations',
      icon: Users,
      link: '/t/attendance/bulk',
      color: 'bg-blue-500'
    },
    {
      title: 'Attendance Analytics',
      description: 'View detailed insights and trends analysis for student attendance',
      icon: BarChart3,
      link: '/t/attendance/analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Attendance Reports',
      description: 'Generate comprehensive reports and export data in various formats',
      icon: FileText,
      link: '/t/attendance/reports',
      color: 'bg-purple-500'
    }
  ]

  // Fetch attendance for the selected date
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['attendance', 'teacher', date],
    queryFn: () => attendanceApi.getAttendance({ date }),
  })

  const attendance = attendanceData?.data || attendanceData || []

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await attendanceApi.createAttendance(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      setShowBulkModal(false)
    }
  })

  const handleBulkMark = () => {
    const attendanceData = attendance.map(record => ({
      studentId: record.studentId._id,
      classId: record.classId._id,
      date,
      status: bulkStatus,
      remarks: ''
    }))

    bulkAttendanceMutation.mutate(attendanceData)
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />
      case 'late': return <Minus className="h-4 w-4 text-yellow-600" />
      case 'excused': return <Minus className="h-4 w-4 text-blue-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            View and manage student attendance records
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowBulkModal(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Mark</span>
            <span className="sm:hidden">Bulk</span>
          </Button>
          
          <Button onClick={() => refetch()} disabled={isLoading} className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Advanced Attendance Features Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {attendanceFeatures.map((feature) => (
          <Link key={feature.title} to={feature.link}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`p-2 sm:p-3 rounded-lg ${feature.color} text-white flex-shrink-0`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Attendance Records */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Attendance Records</h3>
          
          <div className="flex items-center space-x-4">
            <div className="min-w-0 flex-1 sm:flex-none">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Loading attendance records...</p>
          </div>
        ) : attendance.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {attendance.map((record) => (
                <div key={record._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {record.studentId?.userId?.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {record.studentId?.userId?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {record.studentId?.rollNumber || 'No Roll Number'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div><span className="font-medium">Class:</span> {record.classId?.name || 'Unknown Class'}</div>
                    <div><span className="font-medium">Section:</span> {record.classId?.section || 'N/A'}</div>
                    <div><span className="font-medium">Date:</span> {record.date ? new Date(record.date).toLocaleDateString() : '-'}</div>
                    {record.remarks && (
                      <div><span className="font-medium">Remarks:</span> {record.remarks}</div>
                    )}
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
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {record.studentId?.userId?.name?.charAt(0) || 'S'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.studentId?.userId?.name || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {record.studentId?.rollNumber || 'No Roll Number'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {record.classId?.name || 'Unknown Class'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Section {record.classId?.section || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                            {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No attendance records found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No attendance records found for {date}. Try selecting a different date.
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {attendanceData?.pagination && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center sm:text-left">
              Showing {attendance.length} of {attendanceData.pagination.total} records
            </div>
            <div className="text-center sm:text-right">
              Page {attendanceData.pagination.page} of {attendanceData.pagination.pages}
            </div>
          </div>
        )}
      </Card>

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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              This will mark all {attendance.length} students as <strong>{bulkStatus}</strong> for {date}.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkMark}
              disabled={bulkAttendanceMutation.isPending}
              className="w-full sm:w-auto"
            >
              {bulkAttendanceMutation.isPending ? 'Marking...' : 'Mark All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}






