import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { useAuth } from '../../context/AuthContext'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-900">
      <div className="text-xs sm:text-sm opacity-70">{label}</div>
      <div className="text-lg sm:text-xl lg:text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function Circular({ percent = 0 }) {
  const circumference = 2 * Math.PI * 45
  const dash = `${(percent / 100) * circumference} ${circumference}`
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
      <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray={dash} strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" className="sm:text-base">{percent}%</text>
    </svg>
  )
}

export function StudentDashboardPage() {
  const { user } = useAuth()

  // Single overview endpoint (backend provided)
  const { data: overviewResp, isLoading, error, refetch } = useQuery({
    queryKey: ['student-dashboard', 'overview'],
    queryFn: async () => (await api.get('/student-dashboard/overview')).data,
  })

  const overview = overviewResp?.data
  const academic = overview?.overview?.academicPerformance
  const attendance = overview?.overview?.attendance
  const fees = overview?.overview?.fees
  const upcoming = useMemo(() => overview?.upcoming || {}, [overview?.upcoming])
  const notifications = overview?.notifications || []

  const kpiValues = useMemo(() => {
    return [
      { label: 'Average Score', value: `${academic?.averagePercentage ?? 0}%` },
      { label: 'Attendance', value: `${attendance?.percentage ?? 0}%`, sub: `${attendance?.presentDays ?? 0}/${attendance?.totalDays ?? 0} days` },
      { label: 'Fees Paid', value: `₦${(fees?.paidFees ?? 0).toLocaleString()}`, sub: `${fees?.paymentPercentage ?? 0}% of ₦${(fees?.totalFees ?? 0).toLocaleString()}` },
      { label: 'Upcoming Exams', value: (upcoming?.exams?.length ?? 0) }
    ]
  }, [academic, attendance, fees, upcoming])

  const performanceTrend = useMemo(() => {
    const dist = academic?.gradeDistribution
    if (!dist) return [
      { label: 'Excellent', score: 90 },
      { label: 'Good', score: 75 },
      { label: 'Average', score: 60 },
      { label: 'Poor', score: 45 },
    ]
    return [
      { label: 'Excellent', score: 90, count: dist.excellent || 0 },
      { label: 'Good', score: 75, count: dist.good || 0 },
      { label: 'Average', score: 60, count: dist.average || 0 },
      { label: 'Poor', score: 45, count: dist.poor || 0 },
    ]
  }, [academic])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="text-red-700 font-medium">Failed to load dashboard</div>
        <div className="text-sm text-red-600 mt-1">{error.message}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome, {overview?.student?.name || user?.name || 'Student'}</h1>
              <p className="text-white/90 mt-1">Class {overview?.student?.class || '-'} • Stay on top of your academics</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => refetch()} className="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white">Refresh</button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiValues.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      {/* Performance and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 lg:col-span-2 bg-white dark:bg-gray-900">
          <div className="text-sm sm:text-base font-medium mb-3">Performance Overview</div>
          <div className="h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 grid place-items-center bg-white dark:bg-gray-900">
          <div className="text-sm sm:text-base font-medium mb-2">Attendance</div>
          <Circular percent={attendance?.percentage ?? 0} />
          <div className="text-xs text-gray-500 mt-2">Present {attendance?.presentDays ?? 0} of {attendance?.totalDays ?? 0} days</div>
        </div>
      </div>

      {/* Upcoming and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-900 lg:col-span-2">
          <div className="text-sm sm:text-base font-medium mb-3">Upcoming Exams & Assignments</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Exams</div>
              {(upcoming?.exams || []).length ? (upcoming.exams).map((ex) => (
                <div key={ex.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{ex.title}</div>
                  <div className="text-xs text-gray-500">{ex.subject} • {ex.duration} mins</div>
                  <div className="text-xs text-gray-500">{ex.startDate ? new Date(ex.startDate).toLocaleString() : '-'}</div>
                </div>
              )) : (
                <div className="text-xs text-gray-500">No upcoming exams</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Assignments</div>
              {(upcoming?.assignments || []).length ? (upcoming.assignments).map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.subject} • Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</div>
                </div>
              )) : (
                <div className="text-xs text-gray-500">No pending assignments</div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-900">
          <div className="text-sm sm:text-base font-medium mb-3">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <a href="/s/assignments" className="px-2 sm:px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700 text-center">Submit Assignment</a>
            <a href="/s/fees" className="px-2 sm:px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700 text-center">Pay Fees</a>
            <a href="/s/exams" className="px-2 sm:px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700 text-center">View Exams</a>
            <a href="/s/term-results" className="px-2 sm:px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700 text-center">Term Results</a>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-900">
        <div className="text-sm sm:text-base font-medium mb-3">Recent Notifications</div>
        {notifications.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{n.title}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500">No notifications.</div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboardPage




























