import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

export function ExamsAnalyticsPage() {
  const [examId, setExamId] = useState('')
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['reports','exams', examId],
    queryFn: () => reportsApi.getExamAnalytics(examId),
    enabled: false,
  })
  const analytics = data?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Exam ID</label>
          <input className="w-full px-3 py-2 rounded border" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Enter examId" />
        </div>
        <Button onClick={() => examId && refetch()} disabled={!examId || isFetching}>{isFetching ? 'Loading...' : 'Load'}</Button>
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Score Distribution</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.distribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Pass/Fail</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={analytics.passFail || []} cx="50%" cy="50%" outerRadius={80} label>
                {(analytics.passFail || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}