import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { cbtApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function StudentCBTPage() {
  const navigate = useNavigate()
  const [examId, setExamId] = useState('')
  const [answers, setAnswers] = useState({})
  const [duration, setDuration] = useState(0) // minutes
  const [deadline, setDeadline] = useState(null)

  const { data, refetch, isFetching, error } = useQuery({
    queryKey: ['cbt','questions', examId],
    queryFn: () => cbtApi.getQuestions(examId),
    enabled: false,
  })

  const { data: resultData, refetch: refetchResult, isFetching: loadingResult } = useQuery({
    queryKey: ['cbt','result', examId],
    queryFn: () => cbtApi.myResult(examId),
    enabled: false,
  })

  const submitMutation = useMutation({
    mutationFn: (payload) => cbtApi.submit(examId, payload),
    onSuccess: () => { localStorage.removeItem(`cbt_${examId}`); navigate(`/s/exams/${examId}/results`) },
  })

  const questions = data?.data?.questions || []
  const examInfo = data?.data || {}

  useEffect(() => {
    if (examInfo?.duration) {
      setDuration(examInfo.duration)
      const end = Date.now() + examInfo.duration * 60 * 1000
      setDeadline(end)
    }
  }, [examInfo])

  // autosave
  useEffect(() => {
    const saved = localStorage.getItem(`cbt_${examId}`)
    if (saved) setAnswers(JSON.parse(saved))
  }, [examId])
  useEffect(() => {
    if (!examId) return
    localStorage.setItem(`cbt_${examId}`, JSON.stringify(answers))
  }, [examId, answers])

  const timeLeft = useMemo(() => {
    if (!deadline) return null
    const diff = Math.max(0, deadline - Date.now())
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${m}:${String(s).padStart(2,'0')}`
  }, [deadline])

  const selectAnswer = (qid, idx) => setAnswers(prev => ({ ...prev, [qid]: idx }))

  const handleSubmit = () => {
    const payload = { answers }
    submitMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm">Exam ID</label>
          <input className="w-full px-3 py-2 rounded border" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Enter examId" />
        </div>
        <Button onClick={() => examId && refetch()} disabled={!examId || isFetching}>{isFetching ? 'Loading...' : 'Load'}</Button>
        <Button variant="outline" onClick={() => examId && refetchResult()} disabled={!examId || loadingResult}>{loadingResult ? 'Loading...' : 'View Result'}</Button>
        {timeLeft && <div className="text-sm">Time left: {timeLeft}</div>}
      </div>

      <Card className="p-0">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 text-sm font-medium">Questions</div>
        {error && <div className="p-4 text-sm text-red-600">{error.message}</div>}
        {questions.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Load an exam to begin.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {questions.map((q) => (
              <div key={q._id} className="p-3 space-y-2">
                <div className="font-medium">{q.questionText || q.text}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options?.map((opt, idx) => (
                    <label key={idx} className={`px-3 py-2 rounded border cursor-pointer ${answers[q._id]===idx ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''}`}>
                      <input type="radio" className="mr-2" name={q._id} checked={answers[q._id]===idx} onChange={() => selectAnswer(q._id, idx)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitMutation.isPending || questions.length === 0}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Exam'}
        </Button>
      </div>

      {resultData?.data && (
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">My Result</div>
          <div className="text-sm">Score: {resultData.data.score ?? '-'}</div>
          <div className="text-sm">Percentage: {resultData.data.percentage ? `${resultData.data.percentage}%` : '-'}</div>
          <div className="text-sm">Status: {resultData.data.passed ? 'Passed' : 'Failed'}</div>
          <div className="mt-3">
            <Link to={`/s/exams/${examId}/results`} className="text-blue-600 hover:underline">View detailed results</Link>
          </div>
        </Card>
      )}
    </div>
  )
}