import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { examsApi, teachersApi, classesApi } from '../../../lib/api'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../../components/ui/Card'
import { Calendar, Clock, BookOpen, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react'

const initialDetails = {
  title: '',
  description: '',
  classId: '',
  subjectId: '',
  startTime: '',
  endTime: '',
  duration: 60,
  term: 'term1',
  examType: 'midterm',
  academicYear: (() => {
    const year = new Date().getUTCFullYear()
    return `${year}-${year + 1}`
  })(),
}

export function ExamWizard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState(initialDetails)
  const [questions, setQuestions] = useState([])
  const [examId, setExamId] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [errors, setErrors] = useState({})

  // Fetch current teacher's profile with assigned classes and subjects
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => teachersApi.getCurrentTeacher(),
    enabled: !!user?._id,
  })

  // Fetch all classes once and filter down to teacher's assigned classIds
  const { data: classesData } = useQuery({
    queryKey: ['classes','all'],
    queryFn: () => classesApi.getClasses({ limit: 1000 }),
    enabled: !!user?._id,
  })

  const teacher = teacherData?.data
  const teacherSubjects = teacher?.subjects || []
  const teacherClassIds = new Set(teacherSubjects.map(s => s.classId))
  const allClasses = classesData?.data || []
  const assignedClasses = allClasses.filter(c => teacherClassIds.has(c._id))
  const assignedSubjects = teacherSubjects.filter(s => !details.classId || s.classId === details.classId)

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: (examData) => examsApi.createExam(examData),
    onSuccess: (data) => {
      setExamId(data.data._id)
      setStep(2)
      queryClient.invalidateQueries(['exams'])
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    }
  })

  const addQuestionsMutation = useMutation({
    mutationFn: ({ examId, questions }) => examsApi.addQuestions(examId, questions),
    onSuccess: () => {
      setStep(3)
      queryClient.invalidateQueries(['exams'])
    },
    onError: (error) => {
      setErrors({ questions: error.message })
    }
  })

  const publishExamMutation = useMutation({
    mutationFn: (examId) => examsApi.updateExamStatus(examId, 'published'),
    onSuccess: () => {
      alert('Exam published successfully!')
      queryClient.invalidateQueries(['exams'])
    },
    onError: (error) => {
      setErrors({ publish: error.message })
    }
  })

  function addQuestion() {
    setQuestions(q => [...q, {
      id: crypto.randomUUID(),
      questionText: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1
    }])
  }

  function updateQuestion(id, updater) {
    setQuestions(qs => qs.map(q => (q.id === id ? updater(q) : q)))
  }

  function onDragStart(index) { setDragIndex(index) }
  function onDragOver(e) { e.preventDefault() }
  function onDrop(index) {
    if (dragIndex === null || dragIndex === index) return
    setQuestions(prev => {
      const list = [...prev]
      const [moved] = list.splice(dragIndex, 1)
      list.splice(index, 0, moved)
      return list
    })
    setDragIndex(null)
  }

  function validateStep1() {
    const newErrors = {}
    
    if (!details.title.trim()) newErrors.title = 'Title is required'
    if (!details.classId) newErrors.classId = 'Class is required'
    if (!details.subjectId) newErrors.subjectId = 'Subject is required'
    if (!details.term) newErrors.term = 'Term is required'
    if (!details.examType) newErrors.examType = 'Exam type is required'
    if (!details.academicYear || !/^[0-9]{4}-[0-9]{4}$/.test(details.academicYear)) newErrors.academicYear = 'Academic year is required (e.g., 2025-2026)'
    if (!details.startTime) newErrors.startTime = 'Start time is required'
    if (!details.endTime) newErrors.endTime = 'End time is required'
    if (!details.duration || details.duration <= 0) newErrors.duration = 'Duration must be greater than 0'
    
    // Validate time logic
    if (details.startTime && details.endTime) {
      const start = new Date(details.startTime)
      const end = new Date(details.endTime)
      if (start >= end) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep2() {
    if (questions.length === 0) {
      setErrors({ questions: 'At least one question is required' })
      return false
    }

    const newErrors = {}
    questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        newErrors[`question${index}`] = 'Question text is required'
      }
      if (q.type === 'mcq' && q.options.some(opt => !opt.trim())) {
        newErrors[`options${index}`] = 'All options must be filled'
      }
      if (!q.correctAnswer) {
        newErrors[`correct${index}`] = 'Correct answer is required'
      }
      if (!q.marks || q.marks <= 0) {
        newErrors[`marks${index}`] = 'Marks must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function saveExam() {
    if (!validateStep1()) return

    const payload = {
      ...details,
      teacherId: user._id,
      duration: Number(details.duration),
      startTime: new Date(details.startTime).toISOString(),
      endTime: new Date(details.endTime).toISOString(),
    }

    createExamMutation.mutate(payload)
  }

  async function saveQuestions() {
    if (!validateStep2()) return

    const mappedQuestions = questions.map((q, i) => ({
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks),
      order: i
    }))

    addQuestionsMutation.mutate({ examId, questions: mappedQuestions })
  }

  async function publishExam() {
    if (!examId) return
    publishExamMutation.mutate(examId)
  }

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
  const isLoading = teacherLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-500">Loading exam wizard...</div>
        </div>
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Exam Wizard</h1>
              <p className="text-white/90 mt-1">Create, organize, and publish CBT exams in steps</p>
            </div>
            <div className="text-sm sm:text-base text-white/90">
              Step {step} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                {step > 1 ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : '1'}
              </div>
              <span className="font-medium text-xs sm:text-sm">Exam Details</span>
            </div>
            <div className={`w-8 sm:w-16 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                {step > 2 ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : '2'}
              </div>
              <span className="font-medium text-xs sm:text-sm">Questions</span>
            </div>
            <div className={`w-8 sm:w-16 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                {step > 3 ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : '3'}
              </div>
              <span className="font-medium text-xs sm:text-sm">Review & Publish</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Card>
          <CardContent>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-xs sm:text-sm">Please fix the following errors:</span>
              </div>
              <ul className="text-xs sm:text-sm text-red-600 space-y-1">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>• {message}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Exam Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Exam Details</h3>
            <p className="text-xs sm:text-sm text-gray-500">Configure the basic exam information</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Exam Title *</label>
                <input
                  type="text"
                  className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter exam title"
                  value={details.title}
                  onChange={e => setDetails({ ...details, title: e.target.value })}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-2 sm:px-3 py-2 rounded border border-gray-300 text-sm"
                  placeholder="Enter exam description (optional)"
                  rows={3}
                  value={details.description}
                  onChange={e => setDetails({ ...details, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Class *</label>
                  <select
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.classId ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.classId}
                    onChange={e => setDetails({ ...details, classId: e.target.value, subjectId: '' })}
                  >
                    <option value="">Select class</option>
                    {assignedClasses.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Subject *</label>
                  <select
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.subjectId ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.subjectId}
                    onChange={e => setDetails({ ...details, subjectId: e.target.value })}
                  >
                    <option value="">Select subject</option>
                    {assignedSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Term *</label>
                  <select
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.term ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.term}
                    onChange={e => setDetails({ ...details, term: e.target.value })}
                  >
                    <option value="term1">Term 1</option>
                    <option value="term2">Term 2</option>
                    <option value="final">Final</option>
                  </select>
                  {errors.term && <p className="text-red-500 text-xs mt-1">{errors.term}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Exam Type *</label>
                  <select
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.examType ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.examType}
                    onChange={e => setDetails({ ...details, examType: e.target.value })}
                  >
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="assignment">Assignment</option>
                  </select>
                  {errors.examType && <p className="text-red-500 text-xs mt-1">{errors.examType}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Academic Year *</label>
                <input
                  type="text"
                  className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.academicYear ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., 2025-2026"
                  value={details.academicYear}
                  onChange={e => setDetails({ ...details, academicYear: e.target.value })}
                />
                {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.startTime ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.startTime}
                    onChange={e => setDetails({ ...details, startTime: e.target.value })}
                  />
                  {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.endTime ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.endTime}
                    onChange={e => setDetails({ ...details, endTime: e.target.value })}
                  />
                  {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full px-2 sm:px-3 py-2 rounded border text-sm ${errors.duration ? 'border-red-300' : 'border-gray-300'}`}
                    value={details.duration}
                    onChange={e => setDetails({ ...details, duration: Number(e.target.value) || 0 })}
                  />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={createExamMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Skip to Questions
                </Button>
                <Button
                  onClick={saveExam}
                  disabled={createExamMutation.isPending || !details.title || !details.classId || !details.subjectId || !details.startTime || !details.endTime || !details.duration || !details.term || !details.examType || !details.academicYear}
                  className="w-full sm:w-auto"
                >
                  {createExamMutation.isPending ? 'Creating...' : 'Create Exam & Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Exam Questions</h3>
            <p className="text-xs sm:text-sm text-gray-500">Add questions to your exam (drag to reorder)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-500">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} • Total Marks: {totalMarks}
                </div>
                <Button onClick={addQuestion} variant="outline" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(index)}
                    className="rounded-lg border border-gray-200 p-4 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-500">Question {index + 1}</div>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs px-2 py-1 rounded border"
                          value={q.type}
                          onChange={e => updateQuestion(q.id, prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          className="text-xs px-2 py-1 rounded border w-16"
                          placeholder="Marks"
                          value={q.marks}
                          onChange={e => updateQuestion(q.id, prev => ({ ...prev, marks: Number(e.target.value) || 1 }))}
                        />
                      </div>
          </div>

          <div className="space-y-3">
                      <div>
                        <input
                          className={`w-full px-3 py-2 rounded border ${errors[`question${index}`] ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Enter question text"
                          value={q.questionText}
                          onChange={e => updateQuestion(q.id, prev => ({ ...prev, questionText: e.target.value }))}
                        />
                        {errors[`question${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`question${index}`]}</p>}
                      </div>

                      {q.type === 'mcq' && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500">Options:</div>
                  {q.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === opt}
                                onChange={() => updateQuestion(q.id, prev => ({ ...prev, correctAnswer: opt }))}
                              />
                              <input
                                className={`flex-1 px-3 py-2 rounded border ${errors[`options${index}`] ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={e => updateQuestion(q.id, prev => {
                      const options = [...prev.options]
                      options[idx] = e.target.value
                      return { ...prev, options }
                                })}
                              />
                            </div>
                          ))}
                          {errors[`options${index}`] && <p className="text-red-500 text-xs">{errors[`options${index}`]}</p>}
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500">Correct Answer:</div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                value="true"
                                checked={q.correctAnswer === 'true'}
                                onChange={e => updateQuestion(q.id, prev => ({ ...prev, correctAnswer: e.target.value }))}
                              />
                              True
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                value="false"
                                checked={q.correctAnswer === 'false'}
                                onChange={e => updateQuestion(q.id, prev => ({ ...prev, correctAnswer: e.target.value }))}
                              />
                              False
                            </label>
                          </div>
                </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">Correct Answer:</div>
                          <input
                            className={`w-full px-3 py-2 rounded border ${errors[`correct${index}`] ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="Enter correct answer"
                            value={q.correctAnswer}
                            onChange={e => updateQuestion(q.id, prev => ({ ...prev, correctAnswer: e.target.value }))}
                          />
                </div>
                      )}

                      {errors[`correct${index}`] && <p className="text-red-500 text-xs">{errors[`correct${index}`]}</p>}
                      {errors[`marks${index}`] && <p className="text-red-500 text-xs">{errors[`marks${index}`]}</p>}
                </div>
              </div>
            ))}
          </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
                  Back to Details
                </Button>
                <Button
                  onClick={saveQuestions}
                  disabled={addQuestionsMutation.isPending || questions.length === 0}
                  className="w-full sm:w-auto"
                >
                  {addQuestionsMutation.isPending ? 'Saving...' : 'Save Questions & Continue'}
                </Button>
              </div>
        </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Review & Publish</h3>
            <p className="text-xs sm:text-sm text-gray-500">Review your exam settings and publish when ready</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {/* Exam Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-sm sm:text-base">Exam Information</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Title:</strong> {details.title}</span>
                    </div>
                    <div className="flex items_center gap-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Class:</strong> {assignedClasses.find(c => c._id === details.classId)?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Subject:</strong> {assignedSubjects.find(s => s._id === details.subjectId)?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Term:</strong> {details.term}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Type:</strong> {details.examType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Academic Year:</strong> {details.academicYear}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-sm sm:text-base">Timing & Questions</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Duration:</strong> {details.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Start:</strong> {new Date(details.startTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>End:</strong> {new Date(details.endTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Questions:</strong> {questions.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span><strong>Total Marks:</strong> {totalMarks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {details.description && (
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Description</h4>
                  <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded">{details.description}</p>
                </div>
              )}

              {/* Publish Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">
                  Back to Questions
                </Button>
                <Button
                  onClick={publishExam}
                  disabled={publishExamMutation.isPending || !examId}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {publishExamMutation.isPending ? 'Publishing...' : 'Publish Exam'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExamWizard
