import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { examsApi, cbtApi, teachersApi, questionsApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Link } from 'react-router-dom'
import { BookOpen, BarChart3, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react'

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  duration: z.number({ invalid_type_error: 'Duration must be a number' }).min(5, 'Min 5 minutes'),
  term: z.enum(['term1', 'term2', 'term3', 'final'], { required_error: 'Term is required' }),
  examType: z.enum(['midterm', 'final', 'assignment', 'quiz'], { required_error: 'Exam type is required' }),
  academicYear: z.string().regex(/^[0-9]{4}-[0-9]{4}$/,'Format e.g. 2025-2026'),
})

function ExamForm({ onSubmit, user, defaultValues }) {
  // Fetch current teacher's profile with assigned classes and subjects
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => teachersApi.getCurrentTeacher(),
    enabled: !!user?._id,
  })

  const teacher = teacherData?.data
  const assignedClasses = teacher?.classes || []
  const assignedSubjects = teacher?.subjects || []

  const currentYear = new Date().getUTCFullYear()
  const defaultAcademicYear = `${currentYear}-${currentYear + 1}`

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { 
      title: '', 
      description: '', 
      classId: '', 
      subjectId: '', 
      startTime: '', 
      endTime: '', 
      duration: 60, 
      term: 'term1',
      examType: 'midterm',
      academicYear: defaultAcademicYear,
    },
  })

  const selectedClassId = watch('classId')
  const allowedClassIds = new Set(assignedSubjects.map(s => s.classId))
  const filteredClasses = (assignedClasses || []).filter(c => allowedClassIds.has(c._id))
  const subjectsForSelectedClass = (assignedSubjects || []).filter(s => !selectedClassId || s.classId === selectedClassId)

  if (teacherLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      <div>
        <label className="text-xs sm:text-sm font-medium">Title</label>
        <input 
          className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
          placeholder="Enter exam title"
          {...register('title')} 
        />
        {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title.message}</div>}
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium">Description</label>
        <textarea 
          className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
          rows={3} 
          placeholder="Enter exam description (optional)"
          {...register('description')} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs sm:text-sm font-medium">Class</label>
          <select 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('classId')}
          >
            <option value="">Select Class</option>
            {filteredClasses.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} {cls.section}
              </option>
            ))}
          </select>
          {errors.classId && <div className="text-xs text-red-500 mt-1">{errors.classId.message}</div>}
          {filteredClasses.length === 0 && (
            <div className="text-xs text-amber-600 mt-1">No assigned classes found for your subjects.</div>
          )}
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">Subject</label>
          <select 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('subjectId')}
          >
            <option value="">Select Subject</option>
            {subjectsForSelectedClass.map((subj) => (
              <option key={subj._id} value={subj._id}>
                {subj.name}
              </option>
            ))}
          </select>
          {errors.subjectId && <div className="text-xs text-red-500 mt-1">{errors.subjectId.message}</div>}
          {subjectsForSelectedClass.length === 0 && selectedClassId && (
            <div className="text-xs text-amber-600 mt-1">No subjects for the selected class.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs sm:text-sm font-medium">Term</label>
          <select 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('term')}
          >
            <option value="term1">Term 1</option>
            <option value="term2">Term 2</option>
            <option value="term3">Term 3</option>
            <option value="final">Final</option>
          </select>
          {errors.term && <div className="text-xs text-red-500 mt-1">{errors.term.message}</div>}
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">Exam Type</label>
          <select 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('examType')}
          >
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
          </select>
          {errors.examType && <div className="text-xs text-red-500 mt-1">{errors.examType.message}</div>}
        </div>
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium">Academic Year</label>
        <input 
          className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
          placeholder="e.g. 2025-2026"
          {...register('academicYear')}
        />
        {errors.academicYear && <div className="text-xs text-red-500 mt-1">{errors.academicYear.message}</div>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs sm:text-sm font-medium">Start Time</label>
          <input 
            type="datetime-local" 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('startTime')} 
          />
          {errors.startTime && <div className="text-xs text-red-500 mt-1">{errors.startTime.message}</div>}
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">End Time</label>
          <input 
            type="datetime-local" 
            className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
            {...register('endTime')} 
          />
          {errors.endTime && <div className="text-xs text-red-500 mt-1">{errors.endTime.message}</div>}
        </div>
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium">Duration (minutes)</label>
        <input 
          type="number" 
          className="w-full px-2 sm:px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm" 
          min="5"
          {...register('duration', { valueAsNumber: true })} 
        />
        {errors.duration && <div className="text-xs text-red-500 mt-1">{errors.duration.message}</div>}
      </div>

      <div className="flex justify-end pt-2">
        <Button disabled={isSubmitting} className="px-4 sm:px-6 w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

export function TeacherCBTPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editExam, setEditExam] = useState(null)
  
  // Navigation cards for CBT features
  const cbtFeatures = [
    {
      title: 'Create Exam',
      description: 'Use the exam wizard to create comprehensive exams',
      icon: Plus,
      link: '/t/cbt/create',
      color: 'bg-orange-500'
    }
    
  ]
  const [activeExam, setActiveExam] = useState(null)
  const [questionText, setQuestionText] = useState('')
  const [qType, setQType] = useState('mcq') // 'mcq' | 'true_false'
  const [options, setOptions] = useState(['','','',''])
  const [answer, setAnswer] = useState(0)
  const [marks, setMarks] = useState(1)
  const [showResultsFor, setShowResultsFor] = useState(null)

  const { data: exams } = useQuery({ queryKey: ['exams','list'], queryFn: () => examsApi.list({ sort: '-createdAt', limit: 1000 }) })

  const createMutation = useMutation({
    mutationFn: (payload) => examsApi.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams','list'] }); setOpen(false) },
  })
  const updateExamMutation = useMutation({
    mutationFn: ({ id, data }) => examsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams','list'] }); setEditExam(null) },
  })
  const deleteExamMutation = useMutation({
    mutationFn: (id) => examsApi.delete(id),
    onSuccess: (_, deletedId) => { qc.invalidateQueries({ queryKey: ['exams','list'] }); if (activeExam?._id === deletedId) setActiveExam(null) },
  })
  const addQuestionMutation = useMutation({
    mutationFn: ({ id, questions }) => examsApi.addQuestions(id, questions),
    onSuccess: () => { setQuestionText(''); setOptions(['','','','']); setAnswer(0); qc.invalidateQueries({ queryKey: ['exam', activeExam?._id] }) },
  })
  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => questionsApi.update(id, data),
    onSuccess: () => { if (activeExam?._id) qc.invalidateQueries({ queryKey: ['exam', activeExam._id] }) },
  })
  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => questionsApi.delete(id),
    onSuccess: () => { if (activeExam?._id) qc.invalidateQueries({ queryKey: ['exam', activeExam._id] }) },
  })
  const publishMutation = useMutation({
    mutationFn: ({ id, status }) => examsApi.status(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams','list'] }),
  })

  async function createExam(values) {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      classId: values.classId,
      subjectId: values.subjectId,
      teacherId: user?._id, // Automatically get from auth context
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      duration: values.duration,
      term: values.term,
      examType: values.examType,
      academicYear: values.academicYear,
    }
    await createMutation.mutateAsync(payload)
  }

  const addQuestion = () => {
    if (!activeExam || !questionText) return
    const payload = [
      qType === 'mcq'
        ? { type: 'mcq', questionText, options, correctAnswer: options[answer], marks }
        : { type: 'true_false', questionText, options: ['True','False'], correctAnswer: answer === 0 ? 'True' : 'False', marks }
    ]
    addQuestionMutation.mutate({ id: activeExam._id, questions: payload })
  }

  // Fetch selected exam with questions
  const { data: activeExamDetail } = useQuery({
    queryKey: ['exam', activeExam?._id],
    queryFn: () => activeExam?._id ? examsApi.get(activeExam._id) : Promise.resolve(null),
    enabled: !!activeExam?._id,
  })
  const examQuestions = activeExamDetail?.data?.questions || []

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">CBT Management</h1>
              <p className="text-white/90 mt-1">Create, manage, and analyze computer-based tests</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setOpen(true)} className="bg-white/20 hover:bg-white/30 text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CBT Features Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cbtFeatures.map((feature) => (
          <Link key={feature.title} to={feature.link}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`p-2 sm:p-3 rounded-lg ${feature.color} text-white flex-shrink-0`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-0">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Exams</h3>
        </div>
        
        {/* Mobile Card View */}
        <div className="lg:hidden max-h-[60vh] overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-3">
            {(exams?.data || []).map(e => (
              <div key={e._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {e.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {e.duration} min • {e.status || 'draft'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-3">
                    <Button variant="outline" size="sm" onClick={() => setActiveExam(e)} className="text-xs">
                      Questions
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowResultsFor(e._id)} className="text-xs">
                      Results
                    </Button>
                    {e.status !== 'published' ? (
                      <Button size="sm" onClick={() => publishMutation.mutate({ id: e._id, status: 'published' })} className="text-xs">
                        Publish
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => publishMutation.mutate({ id: e._id, status: 'draft' })} className="text-xs">
                        Unpublish
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditExam(e)} className="text-xs">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteExamMutation.mutate(e._id)} className="text-xs text-red-600">
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div><span className="font-medium">Start:</span> {e.startTime ? new Date(e.startTime).toLocaleString() : '-'}</div>
                  <div><span className="font-medium">End:</span> {e.endTime ? new Date(e.endTime).toLocaleString() : '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Window</th>
                <th className="text-left px-4 py-2">Duration</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(exams?.data || []).map(e => (
                <tr key={e._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2">{e.title}</td>
                  <td className="px-4 py-2">{e.startTime ? new Date(e.startTime).toLocaleString() : '-'} → {e.endTime ? new Date(e.endTime).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2">{e.duration} min</td>
                  <td className="px-4 py-2">{e.status || 'draft'}</td>
                  <td className="px-4 py-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveExam(e)}>Questions</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowResultsFor(e._id)}>Results</Button>
                    {e.status !== 'published' ? (
                      <Button size="sm" onClick={() => publishMutation.mutate({ id: e._id, status: 'published' })}>Publish</Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => publishMutation.mutate({ id: e._id, status: 'draft' })}>Unpublish</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditExam(e)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => deleteExamMutation.mutate(e._id)} className="text-red-600">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {activeExam && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="font-medium text-sm sm:text-base">Manage Questions - {activeExam.title}</div>
            <Button variant="outline" onClick={() => setActiveExam(null)} className="w-full sm:w-auto">Close</Button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs sm:text-sm font-medium">Type</label>
                <select className="w-full px-2 sm:px-3 py-2 rounded border text-sm" value={qType} onChange={(e) => setQType(e.target.value)}>
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Marks</label>
                <input type="number" className="w-full px-2 sm:px-3 py-2 rounded border text-sm" value={marks} onChange={(e) => setMarks(Number(e.target.value) || 1)} />
              </div>
            </div>
            <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Question text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            {qType === 'mcq' && options.map((o, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input className="flex-1 px-3 py-2 rounded border text-sm" placeholder={`Option ${i+1}`} value={o} onChange={(e) => setOptions(prev => prev.map((x, idx) => idx===i ? e.target.value : x))} />
                <label className="text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap"><input type="radio" checked={answer===i} onChange={() => setAnswer(i)} /> Correct</label>
              </div>
            ))}
            {qType === 'true_false' && (
              <div className="flex flex_col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-xs sm:text-sm flex items-center gap-1"><input type="radio" checked={answer===0} onChange={() => setAnswer(0)} /> True</label>
                <label className="text-xs sm:text-sm flex items_center gap-1"><input type="radio" checked={answer===1} onChange={() => setAnswer(1)} /> False</label>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={addQuestion} disabled={addQuestionMutation.isPending || !questionText || (qType==='mcq' && options.some(o => !o))} className="w-full sm:w-auto">
                {addQuestionMutation.isPending ? 'Adding...' : 'Add Question'}
              </Button>
            </div>

            {/* Existing questions */}
            <div className="pt-4 border-t">
              <div className="text-xs sm:text-sm font-medium mb-2">Existing Questions</div>
              <div className="space-y-3">
                {examQuestions.map((q) => (
                  <QuestionRow key={q._id} q={q} onUpdate={(data) => updateQuestionMutation.mutate({ id: q._id, data })} onDelete={() => deleteQuestionMutation.mutate(q._id)} />
                ))}
                {examQuestions.length === 0 && (
                  <div className="text-xs text-gray-500">No questions yet.</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {showResultsFor && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="font-medium text-sm sm:text-base">Class Results</div>
            <Button variant="outline" onClick={() => setShowResultsFor(null)} className="w-full sm:w-auto">Close</Button>
          </div>
          <Results examId={showResultsFor} />
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium text-sm sm:text-base">Create New Exam</div>
              <div className="p-4">
                <ExamForm onSubmit={createExam} user={user} />
              </div>
            </div>
          </div>
        </div>
      )}

      {editExam && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditExam(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium text-sm sm:text-base">Edit Exam</div>
              <div className="p-4">
                <ExamForm 
                  user={user}
                  defaultValues={{
                    title: editExam.title || '',
                    description: editExam.description || '',
                    classId: editExam.classId || '',
                    subjectId: editExam.subjectId || '',
                    startTime: editExam.startTime ? new Date(editExam.startTime).toISOString().slice(0,16) : '',
                    endTime: editExam.endTime ? new Date(editExam.endTime).toISOString().slice(0,16) : '',
                    duration: editExam.duration || 60,
                    term: editExam.term || 'term1',
                    examType: editExam.examType || 'midterm',
                    academicYear: editExam.academicYear || ''
                  }}
                  onSubmit={async (values) => {
                    const payload = {
                      title: values.title,
                      description: values.description || undefined,
                      classId: values.classId,
                      subjectId: values.subjectId,
                      startTime: new Date(values.startTime).toISOString(),
                      endTime: new Date(values.endTime).toISOString(),
                      duration: values.duration,
                      term: values.term,
                      examType: values.examType,
                      academicYear: values.academicYear,
                    }
                    await updateExamMutation.mutateAsync({ id: editExam._id, data: payload })
                  }}
                />
                <div className="px-4 pb-4">
                  <Button variant="outline" className="w-full" onClick={() => setEditExam(null)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionRow({ q, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({
    questionText: q.questionText || '',
    type: q.type || 'mcq',
    options: Array.isArray(q.options) ? q.options : ['','','',''],
    correctAnswer: q.correctAnswer || '',
    marks: q.marks || 1,
  })

  const save = () => {
    const payload = {
      questionText: local.questionText,
      type: local.type,
      options: local.type === 'mcq' ? local.options : (local.type === 'true_false' ? ['True','False'] : []),
      correctAnswer: local.correctAnswer,
      marks: Number(local.marks) || 1,
    }
    onUpdate(payload)
    setEditing(false)
  }

  return (
    <div className="border rounded-lg p-3">
      {!editing ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm">
            <div className="font-medium">{q.questionText}</div>
            <div className="text-gray-500 text-xs">Type: {q.type} • Marks: {q.marks}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}>Delete</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input className="w-full px-3 py-2 rounded border text-sm" value={local.questionText} onChange={e => setLocal(prev => ({ ...prev, questionText: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select className="px-2 py-2 rounded border text-sm" value={local.type} onChange={e => setLocal(prev => ({ ...prev, type: e.target.value }))}>
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
            </select>
            <input className="px-3 py-2 rounded border text-sm" type="number" value={local.marks} onChange={e => setLocal(prev => ({ ...prev, marks: Number(e.target.value) || 1 }))} />
            <input className="px-3 py-2 rounded border text-sm" placeholder="Correct answer" value={local.correctAnswer} onChange={e => setLocal(prev => ({ ...prev, correctAnswer: e.target.value }))} />
          </div>
          {local.type === 'mcq' && (
            <div className="space-y-1">
              {local.options.map((o,i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="flex-1 px-3 py-2 rounded border text-sm" value={o} onChange={e => setLocal(prev => ({ ...prev, options: prev.options.map((x,idx)=> idx===i? e.target.value : x) }))} />
                  <label className="text-xs flex items-center gap-1"><input type="radio" checked={local.correctAnswer===o} onChange={() => setLocal(prev => ({ ...prev, correctAnswer: o }))} /> Correct</label>
                </div>
              ))}
            </div>
          )}
          {local.type === 'true_false' && (
            <div className="flex gap-4">
              <label className="text-xs flex items-center gap-1"><input type="radio" checked={local.correctAnswer==='True'} onChange={() => setLocal(prev => ({ ...prev, correctAnswer: 'True' }))} /> True</label>
              <label className="text-xs flex items-center gap-1"><input type="radio" checked={local.correctAnswer==='False'} onChange={() => setLocal(prev => ({ ...prev, correctAnswer: 'False' }))} /> False</label>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Results({ examId }) {
  const { data, isLoading } = useQuery({ queryKey: ['cbt','classResults', examId], queryFn: () => cbtApi.classResults(examId) })
  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>
  const rowsRaw = data?.data ?? data?.results ?? data
  const rows = Array.isArray(rowsRaw) ? rowsRaw : []
  
  return (
    <div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {rows.map((r, idx) => (
          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify_between mb-2">
              <h4 className="font-medium text_gray-900 dark:text-white text-sm">
                {r.student?.name || r.studentId || '-'}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {r.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Score:</span>
                <span className="ml-1 font-medium">{r.score ?? '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Percentage:</span>
                <span className="ml-1 font-medium">{r.percentage != null ? `${r.percentage}%` : '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-3 py-2">Student</th>
              <th className="text-left px-3 py-2">Score</th>
              <th className="text-left px-3 py-2">Percentage</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2">{r.student?.name || r.studentId || '-'}</td>
                <td className="px-3 py-2">{r.score ?? '-'}</td>
                <td className="px-3 py-2">{r.percentage != null ? `${r.percentage}%` : '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {r.passed ? 'Passed' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
