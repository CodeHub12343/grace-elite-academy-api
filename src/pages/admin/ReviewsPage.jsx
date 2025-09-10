import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useState } from 'react'

export function ReviewsPage() {
  const qc = useQueryClient()
  const { data: analytics } = useQuery({ queryKey: ['reviews','analytics'], queryFn: () => reviewsApi.analytics() })
  const [_, setRefresh] = useState(0)
  const listTeachers = analytics?.data?.topTeachers || []

  const deleteMutation = useMutation({
    mutationFn: (id) => reviewsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews','analytics'] })
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reviews Analytics</h1>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Top Rated Teachers</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-2">Teacher</th>
                <th className="text-left px-4 py-2">Avg Rating</th>
                <th className="text-left px-4 py-2">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {listTeachers.map(t => (
                <tr key={t.teacherId} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{t.teacherName || t.teacherId}</td>
                  <td className="px-4 py-2">{t.avgRating?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-2">{t.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Moderation</div>
        <div className="text-sm text-gray-500">Hook a list of recent reviews here and allow delete using the button below.</div>
        <Button variant="outline" onClick={() => setRefresh(x => x+1)}>Refresh</Button>
      </Card>
    </div>
  )
}