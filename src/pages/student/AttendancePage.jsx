import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi, studentsApi } from '../../lib/api'

export function StudentAttendancePage() {
  // Resolve my Student._id
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['students','me'],
    queryFn: () => studentsApi.getStudents({ scope: 'mine', limit: 1 }),
  })
  const studentId = Array.isArray(meData?.data)
    ? meData?.data?.[0]?._id
    : Array.isArray(meData)
      ? meData?.[0]?._id
      : meData?._id

  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 29)
  const startDate = start.toISOString().slice(0,10)
  const endDate = today.toISOString().slice(0,10)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance','student', studentId, startDate, endDate],
    enabled: !!studentId,
    queryFn: () => attendanceApi.getStudentAttendance(studentId, { startDate, endDate }),
  })

  const records = Array.isArray(data?.data) ? data.data : []

  const summary = useMemo(() => {
    const total = records.length
    const present = records.filter(r => (r.status || '').toLowerCase() === 'present').length
    const absent = records.filter(r => (r.status || '').toLowerCase() === 'absent').length
    const late = records.filter(r => (r.status || '').toLowerCase() === 'late').length
    const excused = records.filter(r => (r.status || '').toLowerCase() === 'excused').length
    const pct = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, excused, pct }
  }, [records])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">My Attendance (last 30 days)</div>
        <div className="text-sm text-gray-500">{startDate} — {endDate}</div>
      </div>

      {(meLoading || isLoading) ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs opacity-70">Sessions</div>
              <div className="text-2xl font-semibold">{summary.total}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs opacity-70">Present</div>
              <div className="text-2xl font-semibold text-green-600">{summary.present}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs opacity-70">Absent</div>
              <div className="text-2xl font-semibold text-red-600">{summary.absent}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs opacity-70">Late</div>
              <div className="text-2xl font-semibold text-yellow-600">{summary.late}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs opacity-70">Attendance %</div>
              <div className="text-2xl font-semibold">{summary.pct}%</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Class</th>
                  <th className="text-left px-4 py-2">Subject</th>
                  <th className="text-left px-4 py-2">Teacher</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.length ? records.map((r) => (
                  <tr key={r._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">{r.classId?.name || r.classId || '-'}</td>
                    <td className="px-4 py-2">{r.subjectId?.name || r.subjectId || '-'}</td>
                    <td className="px-4 py-2">{r.teacherId?.userId?.name || r.teacherId?.name || '-'}</td>
                    <td className="px-4 py-2 capitalize">{r.status || '-'}</td>
                    <td className="px-4 py-2">{r.remarks || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No attendance records in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentAttendancePage




























