import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { teachersApi, reviewsApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function StudentReviewsPage() {
  const [teacherId, setTeacherId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const { data: teachers } = useQuery({ queryKey: ['teachers','all'], queryFn: () => teachersApi.getTeachers({ limit: 1000 }) })
  const { data: teacherReviews, refetch, isFetching } = useQuery({
    queryKey: ['reviews','teacher', teacherId],
    queryFn: () => reviewsApi.teacher(teacherId),
    enabled: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => reviewsApi.create(payload),
    onSuccess: () => { setComment(''); setRating(5); alert('Review submitted'); if (teacherId) refetch() },
  })

  const submitReview = () => {
    if (!teacherId || !rating) return
    createMutation.mutate({ teacherId, rating: Number(rating), comment })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Teacher</label>
          <select className="w-full px-3 py-2 rounded border" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Select teacher</option>
            {(teachers?.data || []).map(t => (
              <option key={t._id} value={t._id}>{t.userId?.name || t._id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Rating</label>
          <input type="number" min={1} max={5} className="w-24 px-3 py-2 rounded border" value={rating} onChange={(e) => setRating(e.target.value)} />
        </div>
        <Button onClick={submitReview} disabled={!teacherId || createMutation.isPending}>{createMutation.isPending ? 'Submitting...' : 'Submit'}</Button>
      </div>

      <Card className="p-4">
        <label className="text-sm">Comment</label>
        <textarea className="w-full px-3 py-2 rounded border" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share feedback..." />
      </Card>

      <Card className="p-0">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <div className="font-medium">Teacher Reviews</div>
          <Button variant="outline" size="sm" onClick={() => teacherId && refetch()} disabled={!teacherId || isFetching}>{isFetching ? 'Loading...' : 'Refresh'}</Button>
        </div>
        {(teacherReviews?.data || []).length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Select a teacher and refresh to view reviews.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(teacherReviews?.data || []).map(r => (
              <div key={r._id} className="p-3">
                <div className="text-sm font-medium">Rating: {r.rating} / 5</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{r.comment || '-'}</div>
                <div className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}