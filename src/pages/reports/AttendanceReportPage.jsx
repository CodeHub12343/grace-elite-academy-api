import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function AttendanceReportPage() {
  const [classId, setClassId] = useState('')
  const [period, setPeriod] = useState('month')
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['reports','attendance', classId, period],
    queryFn: () => reportsApi.getAttendanceSummary(classId, { period }),
    enabled: false,
  })
  const trend = data?.data?.trend || []

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Class ID</label>
          <input className="w-full px-3 py-2 rounded border" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Enter classId" />
        </div>
        <div>
          <label className="text-sm">Period</label>
          <select className="w-full px-3 py-2 rounded border" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <Button onClick={() => classId && refetch()} disabled={!classId || isFetching}>{isFetching ? 'Loading...' : 'Load'}</Button>
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Attendance Trend</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="present" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}