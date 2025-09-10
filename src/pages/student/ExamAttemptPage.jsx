import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'

export function ExamAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answersByQ, setAnswersByQ] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        // quick eligibility pre-check using exam meta if available
        try {
          const examRes = await api.get(`/exams/${id}`)
          const ex = examRes?.data?.data || examRes?.data
          if (ex) {
            const now = Date.now()
            const start = ex.startTime ? new Date(ex.startTime).getTime() : 0
            const end = ex.endTime ? new Date(ex.endTime).getTime() : 0
            if (start && now < start) throw { response: { status: 403, data: { message: 'Exam has not started yet' } } }
            if (end && now > end) throw { response: { status: 403, data: { message: 'Exam has ended' } } }
          }
        } catch { /* ignore if exam meta not accessible */ }

        const res = await api.get(`/cbt/exams/${id}/questions`)
        if (!active) return
        const payload = res.data?.data || res.data || {}
        // backend returns { examId, questions, duration }
        setExam({ id: payload.examId || id, title: payload.title, duration: payload.duration })
        setQuestions(Array.isArray(payload.questions) ? payload.questions : [])
        const durationSeconds = ((payload.duration) || 60) * 60
        setSecondsLeft(durationSeconds)
      } catch (err) {
        if (!active) return
        const status = err?.response?.status
        const errorData = err?.response?.data
        let msg = 'Failed to load exam.'
        if (status === 401) msg = 'You are not signed in. Please sign in to attempt this exam.'
        else if (status === 403) msg = errorData?.message || 'Access denied. The exam may not be published or you are not enrolled in the class.'
        else if (status === 404) msg = 'Exam or questions not found. Verify the exam ID.'
        else if (errorData?.message) msg = `Error: ${errorData.message}`
        setLoadError({ status, message: msg, details: errorData })
        setExam(null)
        setQuestions([])
        setSecondsLeft(0)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!secondsLeft) return
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  useEffect(() => {
    if (secondsLeft === 0 && exam && questions.length && !submitting) {
      handleSubmit()
    }
  }, [secondsLeft, exam, questions.length, submitting])

  function setAnswer(qid, optionValue) {
    setAnswersByQ((prev) => ({ ...prev, [qid]: optionValue }))
  }

  const hhmmss = useMemo(() => {
    const h = Math.floor(secondsLeft / 3600).toString().padStart(2, '0')
    const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(secondsLeft % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }, [secondsLeft])

  const progress = useMemo(() => {
    const answered = Object.keys(answersByQ).length
    const total = questions.length
    return total > 0 ? Math.round((answered / total) * 100) : 0
  }, [answersByQ, questions.length])

  const timeWarning = useMemo(() => {
    if (secondsLeft <= 300) return 'text-red-600' // 5 minutes
    if (secondsLeft <= 600) return 'text-yellow-600' // 10 minutes
    return 'text-green-600'
  }, [secondsLeft])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      // backend expects: examId, answers[], status='submitted'
      const answers = Object.entries(answersByQ).map(([questionId, selectedOption]) => ({ questionId, selectedOption }))
      await api.post(`/cbt/exams/${id}/submit`, { examId: id, answers, status: 'submitted' })
      navigate(`/s/exams/${id}/results`)
    } finally {
      setSubmitting(false)
    }
  }

  const goToQuestion = (index) => {
    setCurrentQuestion(index)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading Exam...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we prepare your exam</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Exam Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{loadError.message}</p>
          {loadError.details && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              Details: {JSON.stringify(loadError.details)}
            </div>
          )}
          <Button onClick={() => window.history.back()} variant="outline" className="w-full">
            ← Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Exam Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">The exam you're looking for doesn't exist</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 h-auto md:h-16 py-3 md:py-0">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/s/exams')}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Exams</span>
              </Button>
              <div className="md:block">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{exam.title}</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Computer Based Test</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              {/* Progress */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {progress}%
                </div>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Timer */}
              <div className={`px-3 sm:px-4 py-2 rounded-lg border-2 font-mono text-base sm:text-lg font-bold ${timeWarning} bg-white dark:bg-gray-800 border-current`}>
                {hhmmss}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {questions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Questions Available</h3>
                <p className="text-gray-600 dark:text-gray-400">This exam doesn't have any questions yet. Please contact your teacher.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Question Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Question</span>
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {currentQuestion + 1} of {questions.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevQuestion}
                        disabled={currentQuestion === 0}
                        className="flex items-center space-x-1 w-full sm:w-auto justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextQuestion}
                        disabled={currentQuestion === questions.length - 1}
                        className="flex items-center space-x-1 w-full sm:w-auto justify-center"
                      >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                      {questions[currentQuestion]?.questionText || questions[currentQuestion]?.text}
                    </h3>
                    
                    {Array.isArray(questions[currentQuestion]?.options) && (
                      <div className="space-y-2 sm:space-y-3">
                        {questions[currentQuestion].options.map((option, index) => (
                          <label
                            key={index}
                            className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              answersByQ[questions[currentQuestion]._id || questions[currentQuestion].id] === option
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${questions[currentQuestion]._id || questions[currentQuestion].id}`}
                              checked={answersByQ[questions[currentQuestion]._id || questions[currentQuestion].id] === option}
                              onChange={() => setAnswer(questions[currentQuestion]._id || questions[currentQuestion].id, option)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                              answersByQ[questions[currentQuestion]._id || questions[currentQuestion].id] === option
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {answersByQ[questions[currentQuestion]._id || questions[currentQuestion].id] === option && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={currentQuestion === 0}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {currentQuestion === questions.length - 1 ? (
                        <Button
                          onClick={() => setShowConfirmSubmit(true)}
                          disabled={submitting}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full sm:w-auto"
                        >
                          {submitting ? 'Submitting...' : 'Submit Exam'}
                        </Button>
                      ) : (
                        <Button
                          onClick={nextQuestion}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto"
                        >
                          Next Question
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 sticky top-24">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4 sm:mb-6">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentQuestion === index
                        ? 'bg-blue-500 text-white'
                        : answersByQ[questions[index]?._id || questions[index]?.id]
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Answered:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {Object.keys(answersByQ).length} / {questions.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {questions.length - Object.keys(answersByQ).length}
                  </span>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={submitting || questions.length === 0}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Submit Exam?</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                You have answered {Object.keys(answersByQ).length} out of {questions.length} questions. 
                Are you sure you want to submit your exam? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
