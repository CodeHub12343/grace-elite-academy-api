import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'

export function StudentReportPage() {
  const [studentId, setStudentId] = useState('')
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['reports','student', studentId],
    queryFn: () => reportsApi.getStudentReport(studentId),
    enabled: false,
  })
  const report = data?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Student ID</label>
          <input className="w-full px-3 py-2 rounded border" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enter studentId" />
        </div>
        <Button onClick={() => studentId && refetch()} disabled={!studentId || isFetching}>{isFetching ? 'Loading...' : 'Load'}</Button>
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Performance Trend</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.performance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Subject Distribution</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.subjects || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}