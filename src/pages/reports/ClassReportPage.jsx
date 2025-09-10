import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function ClassReportPage() {
  const [classId, setClassId] = useState('')
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['reports','class', classId],
    queryFn: () => reportsApi.getClassReport(classId),
    enabled: false,
  })
  const report = data?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Class ID</label>
          <input className="w-full px-3 py-2 rounded border" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Enter classId" />
        </div>
        <Button onClick={() => classId && refetch()} disabled={!classId || isFetching}>{isFetching ? 'Loading...' : 'Load'}</Button>
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Capacity Utilization</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.capacity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}