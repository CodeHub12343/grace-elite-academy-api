

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/Button'
import { teacherGradesApi, studentsApi, subjectsApi, classesApi, termResultsApi } from '../../lib/api'
import { api } from '../../lib/axios'

function Section({ title, children, actions, notice }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-gray-800 gap-2">
        <div className="font-medium text-sm sm:text-base">{title}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {notice}
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  )
}

function TextInput({ label, error, register, name, type = 'text', placeholder, className = '', value, onChange, ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <input 
        className={`mt-1 w-full px-2 sm:px-3 py-2 rounded border text-sm ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`} 
        type={type} 
        placeholder={placeholder} 
        {...(register && name ? register(name) : {})}
        value={value}
        onChange={onChange}
        {...rest} 
      />
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}

function Select({ label, error, register, name, options = [], className = '', onChange, value, ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <select 
        className={`mt-1 w-full px-2 sm:px-3 py-2 rounded border text-sm ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`} 
        {...(register && name ? register(name) : {})}
        onChange={onChange}
        value={value}
        {...rest}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <div className="mt-1 text-xs text-red-600">{error.message}</div>}
    </label>
  )
}

function Banner({ kind = 'success', children }) {
  const cls = kind === 'error' ? 'border-red-200 text-red-700 bg-red-50' : 'border-green-200 text-green-700 bg-green-50'
  return <div className={`px-3 sm:px-4 py-2 border rounded text-sm ${cls}`}>{children}</div>
}

function Kpi({ title, value, subtitle }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-4">
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{title}</div>
      <div className="text-lg sm:text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

// Schemas
const singleGradeSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  term: z.string().min(1, 'Term is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  marks: z.coerce.number().positive('Marks must be > 0'),
  maxMarks: z.coerce.number().positive('Max marks must be > 0'),
  remarks: z.string().optional(),
  examType: z.string().min(1, 'Exam type is required'),
  examTitle: z.string().min(1, 'Exam title is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  isPublished: z.boolean().default(false)
})

const bulkGradeSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  term: z.string().min(1, 'Term is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  examType: z.string().min(1, 'Exam type is required'),
  examTitle: z.string().min(1, 'Exam title is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  isPublished: z.boolean().default(false)
})

function useConfirm() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ title: '', message: '', onConfirm: null })
  
  function ask({ title, message, onConfirm }) { 
    setState({ title, message, onConfirm }); 
    setOpen(true) 
  }
  
  function Confirm() {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5 w-full max-w-md">
          <div className="text-base sm:text-lg font-medium mb-2">{state.title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{state.message}</div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={() => { const fn = state.onConfirm; setOpen(false); fn && fn() }} className="w-full sm:w-auto">Confirm</Button>
          </div>
        </div>
      </div>
    )
  }
  
  return { ask, Confirm }
}

export function GradesPage() {
  const [tab, setTab] = useState('upload')
  const [selectedClass, setSelectedClass] = useState('')
  const [bulkGrades, setBulkGrades] = useState([])
  const qc = useQueryClient()
  const { ask, Confirm } = useConfirm()

  // Get teacher assignments (using the correct backend endpoint)
  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: async () => {
      console.log('🔍 Fetching teacher profile...')
      const response = await api.get('/teachers/me')
      console.log('📊 Raw API response:', response)
      console.log('📊 Response data:', response.data)
      return response.data
    },
  })
  const assignments = assignmentsData?.data || { subjects: [], classes: [] }
  
  // Fetch teacher's actual classes via scope=enrolled (authoritative)
  const { data: teacherClassesData } = useQuery({
    queryKey: ['classes', 'teacher', 'enrolled'],
    queryFn: async () => {
      const response = await classesApi.getClasses({ scope: 'enrolled', limit: 200 })
      return response
    }
  })
  const teacherClasses = teacherClassesData?.data || assignments.classes || []

  // Debug assignments data
  console.log('🎯 Teacher Profile Data:', assignments)
  console.log('🎯 Teacher Subjects:', assignments.subjects)
  console.log('🎯 Teacher Classes (scoped):', teacherClasses)
  console.log('🎯 Is Loading:', assignmentsLoading)
  console.log('🎯 Has Error:', assignmentsError)

  // Get students for selected class
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', 'class', selectedClass],
    queryFn: async () => {
      console.log('🔍 Fetching students for class:', selectedClass)
      const response = await studentsApi.getStudents({ classId: selectedClass })
      console.log('📊 Students response:', response)
      return response
    },
    enabled: !!selectedClass,
  })
  const students = studentsData?.data || []
  
  // Debug students data
  console.log('🎯 Selected Class:', selectedClass)
  console.log('🎯 Students Data:', studentsData)
  console.log('🎯 Students:', students)
  console.log('🎯 Students Loading:', studentsLoading)
  console.log('🎯 Students Error:', studentsError)

  // Get subjects
  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await subjectsApi.getSubjects()
      return response
    },
  })
  // const subjects = subjectsData?.data || [] // Not used since we get subjects from teacher assignments

  // Note: Removed fallback data to prevent 403 errors
  // Teachers can only grade students in their assigned classes/subjects

  // Get teacher's grades
  const [gradeFilters, setGradeFilters] = useState({ 
    classId: '', 
    subjectId: '', 
    term: '',
    academicYear: '' 
  })
  const { data: gradesData, isLoading: gradesLoading, refetch: refetchGrades } = useQuery({
    queryKey: ['teacher-grades', 'my-grades', gradeFilters],
    queryFn: async () => {
      const response = await teacherGradesApi.getMyGrades(gradeFilters)
      return response.data
    },
    enabled: true,
  })
  const grades = gradesData?.data || []
  const gradesSummary = gradesData?.summary || {}

  // Single grade upload
  const [singleMsg, setSingleMsg] = useState(null)
  const uploadSingleGrade = useMutation({
    mutationFn: async (payload) => {
      const response = await teacherGradesApi.uploadGrade(payload)
      return response.data
    },
    onSuccess: (data) => { 
      refetchGrades(); 
      setSingleMsg({ kind: 'success', text: `Grade uploaded successfully! Grade: ${data.grade} (${data.percentage}%)` })
      singleForm.reset()
      // Clear message after 5 seconds
      setTimeout(() => setSingleMsg(null), 5000)
    },
    onError: (e) => {
      setSingleMsg({ kind: 'error', text: e.message })
      // Clear error message after 5 seconds
      setTimeout(() => setSingleMsg(null), 5000)
    },
  })

  // Get current academic year and term
  const currentYear = new Date().getFullYear()
  const currentAcademicYear = `${currentYear}-${currentYear + 1}`
  const currentDate = new Date().toISOString().split('T')[0]

  const singleForm = useForm({ 
    resolver: zodResolver(singleGradeSchema), 
    defaultValues: { 
    studentId: '',
      classId: '', 
      subjectId: '', 
      term: 'term1', 
      academicYear: currentAcademicYear, 
      marks: '', 
      maxMarks: '100', 
      remarks: '', 
      examType: 'final', 
      examTitle: '', 
      examDate: currentDate, 
      isPublished: false 
    } 
  })

  // Bulk grade upload
  const [bulkMsg, setBulkMsg] = useState(null)
  const uploadBulkGrades = useMutation({
    mutationFn: async (payload) => {
      const response = await teacherGradesApi.bulkUploadGrades(payload)
      return response.data
    },
    onSuccess: (data) => { 
      refetchGrades(); 
      const summary = data.summary || {}
      setBulkMsg({ 
        kind: 'success', 
        text: `Bulk upload completed! ${summary.successful || 0}/${summary.total || 0} grades processed successfully` 
      })
      setBulkGrades([])
      bulkForm.reset()
      // Clear message after 5 seconds
      setTimeout(() => setBulkMsg(null), 5000)
    },
    onError: (e) => {
      setBulkMsg({ kind: 'error', text: e.message })
      // Clear error message after 5 seconds
      setTimeout(() => setBulkMsg(null), 5000)
    },
  })

  const bulkForm = useForm({ 
    resolver: zodResolver(bulkGradeSchema), 
    defaultValues: { 
      classId: '', 
      subjectId: '', 
      term: 'term1', 
      academicYear: currentAcademicYear, 
      examType: 'final', 
      examTitle: '', 
      examDate: currentDate, 
      isPublished: false 
    } 
  })

  // Grade actions
  const publishGrade = useMutation({
    mutationFn: async (id) => {
      const response = await teacherGradesApi.publishGrade(id)
      return response.data
    },
    onSuccess: () => { 
      refetchGrades(); 
      try { window?.toast?.success?.('Grade published successfully') } catch { /* ignore */ }
    },
    onError: (e) => {
      try { window?.toast?.error?.(e.message) } catch { /* ignore */ }
    },
  })

  const deleteGrade = useMutation({
    mutationFn: async (id) => {
      const response = await teacherGradesApi.deleteGrade(id)
      return response.data
    },
    onSuccess: () => { 
      refetchGrades(); 
      try { window?.toast?.success?.('Grade deleted successfully') } catch { /* ignore */ }
    },
    onError: (e) => {
      try { window?.toast?.error?.(e.message) } catch { /* ignore */ }
    },
  })

  // Aggregate term result (admin/teacher) for a specific student/class/term/year
  const aggregateTermResult = useMutation({
    mutationFn: async ({ studentId, classId, term, academicYear }) => {
      const response = await termResultsApi.aggregateFromTeacherGrades({ studentId, classId, term, academicYear, publish: true })
      return response
    },
    onSuccess: () => {
      try { window?.toast?.success?.('Term result aggregated successfully') } catch { /* ignore */ }
    },
    onError: (e) => {
      try { window?.toast?.error?.(e.message) } catch { /* ignore */ }
    }
  })

  // Bulk publish all draft grades in current filter
  const publishAllDraft = useMutation({
    mutationFn: async (gradeIds) => {
      const tasks = gradeIds.map((id) => teacherGradesApi.publishGrade(id))
      const results = await Promise.allSettled(tasks)
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failCount = results.filter(r => r.status === 'rejected').length
      try { window?.toast?.success?.(`Published ${successCount} grades${failCount ? `, ${failCount} failed` : ''}`) } catch { /* noop */ }
      refetchGrades()
    },
    onError: (e) => {
      try { window?.toast?.error?.(e.message) } catch { /* noop */ }
    }
  })

  // Handle bulk grades input
  const handleBulkGradesChange = (index, field, value) => {
    const newBulkGrades = [...bulkGrades]
    newBulkGrades[index] = { ...newBulkGrades[index], [field]: value }
    
    // Auto-calculate percentage if marks and maxMarks are provided
    if (field === 'marks' || field === 'maxMarks') {
      const marks = field === 'marks' ? parseFloat(value) : parseFloat(newBulkGrades[index].marks)
      const maxMarks = field === 'maxMarks' ? parseFloat(value) : parseFloat(newBulkGrades[index].maxMarks)
      if (marks && maxMarks && maxMarks > 0) {
        const percentage = Math.round((marks / maxMarks) * 100 * 100) / 100
        newBulkGrades[index].percentage = percentage
      }
    }
    
    setBulkGrades(newBulkGrades)
  }

  const addBulkGrade = () => {
    if (students.length === 0) return
    setBulkGrades([...bulkGrades, { studentId: '', marks: '', maxMarks: '', remarks: '' }])
  }

  const removeBulkGrade = (index) => {
    setBulkGrades(bulkGrades.filter((_, i) => i !== index))
  }

  // Auto-populate students when class is selected in bulk form
  const handleBulkClassChange = (classId) => {
    if (classId && students.length > 0) {
      // Auto-populate with students from the selected class
      const newBulkGrades = students.map(student => ({
        studentId: student._id,
        marks: '',
        maxMarks: '',
        remarks: ''
      }))
      setBulkGrades(newBulkGrades)
    } else {
      setBulkGrades([])
    }
  }

  useEffect(() => {
    if (!['upload', 'bulk', 'view', 'summary'].includes(tab)) setTab('upload')
  }, [tab])

  const termOptions = [
    { value: 'term1', label: 'Term 1' },
    { value: 'term2', label: 'Term 2' },
    { value: 'final', label: 'Final' }
  ]

  const examTypeOptions = [
    { value: 'midterm', label: 'Midterm' },
    { value: 'final', label: 'Final' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'quiz', label: 'Quiz' }
  ]

  const renderUploadTab = () => {
    if (assignmentsLoading) {
      return <div className="text-center py-8">Loading your assignments...</div>
    }

    if (assignmentsError) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Error loading assignments:</div>
          <div className="text-sm text-gray-600">{assignmentsError.message}</div>
        </div>
      )
    }

    // Check if teacher has no assignments
    if (!assignmentsLoading && (!assignments.classes || assignments.classes.length === 0) && (!assignments.subjects || assignments.subjects.length === 0)) {
      return (
        <div className="text-center py-8">
          <div className="text-yellow-600 mb-2">No Classes or Subjects Assigned</div>
          <div className="text-sm text-gray-600">
            You don't have any classes or subjects assigned to you yet. 
            Please contact your administrator to assign classes and subjects to your account.
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <div><strong>Debug Info:</strong></div>
            <div>Loading: {assignmentsLoading ? 'Yes' : 'No'}</div>
            <div>Assignments Data: {JSON.stringify(assignments, null, 2)}</div>
            <div>Classes Length: {assignments.classes?.length || 0}</div>
            <div>Subjects Length: {assignments.subjects?.length || 0}</div>
            {assignmentsError && <div className="text-red-600">Error: {assignmentsError.message}</div>}
          </div>
        </div>
      )
    }

    // Debug info
    console.log('Assignments data:', assignments)
    console.log('Teacher subjects:', assignments.subjects)
    console.log('Teacher classes:', assignments.classes)
    console.log('Students in selected class:', students)

  return (
      <div className="space-y-4">
        {/* Debug info */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
          <div className="flex justify-between items-center mb-2">
            <strong>Debug Info:</strong>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => {
                qc.invalidateQueries({ queryKey: ['teacher', 'me'] })
                qc.invalidateQueries({ queryKey: ['subjects'] })
                qc.invalidateQueries({ queryKey: ['students', 'class', selectedClass] })
              }}>
                Refresh Data
              </Button>
              <Button size="sm" variant="secondary" onClick={async () => {
                console.log('=== API TEST ===')
                try {
                  const response = await api.get('/teachers/me')
                  console.log('✅ Direct API call successful:', response.data)
                } catch (error) {
                  console.log('❌ Direct API call failed:', error)
                }
                console.log('Teacher Profile:', assignmentsData)
                console.log('Subjects:', subjectsData)
                console.log('Students in class:', studentsData)
                console.log('================')
              }}>
                Test APIs
              </Button>
            </div>
          </div>
          <div>Teacher Classes: {assignments.classes?.length || 0}</div>
          <div>Teacher Subjects: {assignments.subjects?.length || 0}</div>
          <div>Selected Class: {selectedClass || 'None'}</div>
          <div>Students in selected class: {students.length}</div>
          {(assignmentsLoading || subjectsLoading || studentsLoading) && <div className="text-blue-600">Loading data...</div>}
          {assignmentsError && <div className="text-red-600">Assignments Error: {assignmentsError.message}</div>}
          {subjectsError && <div className="text-red-600">Subjects Error: {subjectsError.message}</div>}
          {studentsError && <div className="text-red-600">Students Error: {studentsError.message}</div>}
        </div>
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" onSubmit={singleForm.handleSubmit((values) => ask({
        title: 'Upload Grade',
        message: `Upload grade for ${values.marks}/${values.maxMarks}?`,
        onConfirm: () => uploadSingleGrade.mutate({ ...values, marks: Number(values.marks), maxMarks: Number(values.maxMarks) }),
      }))}>
        <Select 
          label="Class" 
          name="classId" 
          register={singleForm.register} 
          error={singleForm.formState.errors.classId} 
          options={(teacherClasses || []).map(c => ({ value: c._id, label: c.name }))}
          onChange={(e) => {
            singleForm.setValue('classId', e.target.value)
            setSelectedClass(e.target.value)
          }}
        />
        <Select 
          label="Subject" 
          name="subjectId" 
          register={singleForm.register} 
          error={singleForm.formState.errors.subjectId} 
          options={(assignments.subjects || []).map(s => ({ value: s._id, label: s.name }))}
        />
        <Select 
          label="Student" 
          name="studentId" 
          register={singleForm.register} 
          error={singleForm.formState.errors.studentId} 
          options={students.map(s => ({ value: s._id, label: s.userId?.name || s.rollNumber || s._id }))}
        />
        <Select 
          label="Term" 
          name="term" 
          register={singleForm.register} 
          error={singleForm.formState.errors.term} 
          options={termOptions}
        />
        <TextInput 
          label="Academic Year" 
          name="academicYear" 
          register={singleForm.register} 
          error={singleForm.formState.errors.academicYear} 
          placeholder="2023-2024"
        />
        <TextInput 
          label="Marks" 
          name="marks" 
          type="number" 
          register={singleForm.register} 
          error={singleForm.formState.errors.marks} 
        />
        <TextInput 
          label="Max Marks" 
          name="maxMarks" 
          type="number" 
          register={singleForm.register} 
          error={singleForm.formState.errors.maxMarks} 
        />
        <Select 
          label="Exam Type" 
          name="examType" 
          register={singleForm.register} 
          error={singleForm.formState.errors.examType} 
          options={examTypeOptions}
        />
        <TextInput 
          label="Exam Title" 
          name="examTitle" 
          register={singleForm.register} 
          error={singleForm.formState.errors.examTitle} 
        />
        <TextInput 
          label="Exam Date" 
          name="examDate" 
          type="date" 
          register={singleForm.register} 
          error={singleForm.formState.errors.examDate} 
        />
        <TextInput 
          label="Remarks" 
          name="remarks" 
          register={singleForm.register} 
          error={singleForm.formState.errors.remarks} 
        />
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            {...singleForm.register('isPublished')} 
            id="isPublished"
          />
          <label htmlFor="isPublished" className="text-sm">Publish immediately</label>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={uploadSingleGrade.isPending} className="w-full sm:w-auto">
            {uploadSingleGrade.isPending ? 'Uploading...' : 'Upload Grade'}
        </Button>
        </div>
      </form>
      </div>
    )
  }

  const renderBulkTab = () => {
    if (assignmentsLoading) {
      return <div className="text-center py-8">Loading your assignments...</div>
    }

    if (assignmentsError) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Error loading assignments:</div>
          <div className="text-sm text-gray-600">{assignmentsError.message}</div>
                </div>
      )
    }

    // Check if teacher has no assignments
    if (!assignmentsLoading && (!assignments.classes || assignments.classes.length === 0) && (!assignments.subjects || assignments.subjects.length === 0)) {
      return (
        <div className="text-center py-8">
          <div className="text-yellow-600 mb-2">No Classes or Subjects Assigned</div>
          <div className="text-sm text-gray-600">
            You don't have any classes or subjects assigned to you yet. 
            Please contact your administrator to assign classes and subjects to your account.
                </div>
              </div>
      )
    }

    return (
      <form className="space-y-4" onSubmit={bulkForm.handleSubmit((values) => {
        if (bulkGrades.length === 0) {
          setBulkMsg({ kind: 'error', text: 'Please add at least one grade' })
          return
        }
        ask({
          title: 'Bulk Upload Grades',
          message: `Upload ${bulkGrades.length} grades?`,
          onConfirm: () => uploadBulkGrades.mutate({ ...values, grades: bulkGrades }),
        })
      })}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Select 
            label="Class" 
            name="classId" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.classId} 
            options={(teacherClasses || []).map(c => ({ value: c._id, label: c.name }))}
            onChange={(e) => {
              bulkForm.setValue('classId', e.target.value)
              setSelectedClass(e.target.value)
              handleBulkClassChange(e.target.value)
            }}
          />
          <Select 
            label="Subject" 
            name="subjectId" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.subjectId} 
            options={(assignments.subjects || []).map(s => ({ value: s._id, label: s.name }))}
          />
          <Select 
            label="Term" 
            name="term" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.term} 
            options={termOptions}
          />
          <TextInput 
            label="Academic Year" 
            name="academicYear" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.academicYear} 
            placeholder="2023-2024"
          />
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Select 
            label="Exam Type" 
            name="examType" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.examType} 
            options={examTypeOptions}
          />
          <TextInput 
            label="Exam Title" 
            name="examTitle" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.examTitle} 
          />
          <TextInput 
            label="Exam Date" 
            name="examDate" 
            type="date" 
            register={bulkForm.register} 
            error={bulkForm.formState.errors.examDate} 
          />
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              {...bulkForm.register('isPublished')} 
              id="bulkIsPublished"
            />
            <label htmlFor="bulkIsPublished" className="text-sm">Publish immediately</label>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Student Grades</h3>
            <Button type="button" variant="secondary" onClick={addBulkGrade}>Add Student</Button>
          </div>
          
                        {bulkGrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Select a class to auto-populate students, or click "Add Student" to start adding grades
                </div>
              ) : (
                <div className="space-y-3">
                  {bulkGrades.map((grade, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-3 border rounded">
                  <Select 
                    label="Student" 
                    value={grade.studentId || ''} 
                    onChange={(e) => handleBulkGradesChange(index, 'studentId', e.target.value)}
                    options={students.map(s => ({ value: s._id, label: s.userId?.name || s.rollNumber }))}
                  />
                  <TextInput 
                    label="Marks" 
                    type="number" 
                    value={grade.marks || ''} 
                    onChange={(e) => handleBulkGradesChange(index, 'marks', e.target.value)}
                  />
                  <TextInput 
                    label="Max Marks" 
                    type="number" 
                    value={grade.maxMarks || ''} 
                    onChange={(e) => handleBulkGradesChange(index, 'maxMarks', e.target.value)}
                  />
                  <div className="flex items-end">
                    <div className="w-full">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Percentage</span>
                      <div className="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border text-sm">
                        {grade.percentage ? `${grade.percentage}%` : 'N/A'}
                      </div>
                    </div>
            </div>
                  <TextInput 
                    label="Remarks" 
                    value={grade.remarks || ''} 
                    onChange={(e) => handleBulkGradesChange(index, 'remarks', e.target.value)}
                  />
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => removeBulkGrade(index)}
                      className="w-full"
                    >
                      Remove
                    </Button>
            </div>
            </div>
              ))}
            </div>
          )}
              </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={uploadBulkGrades.isPending} className="w-full sm:w-auto">
            {uploadBulkGrades.isPending ? 'Uploading...' : `Upload ${bulkGrades.length} Grades`}
          </Button>
              </div>
      </form>
    )
  }

  const renderViewTab = () => {
    if (assignmentsLoading) {
      return <div className="text-center py-8">Loading your assignments...</div>
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Select 
            label="Class" 
            value={gradeFilters.classId} 
            onChange={(e) => {
              setGradeFilters({ ...gradeFilters, classId: e.target.value })
              setSelectedClass(e.target.value)
            }}
            options={(assignments.classes || []).map(c => ({ value: c._id, label: c.name }))}
          />
          <Select 
            label="Subject" 
            value={gradeFilters.subjectId} 
            onChange={(e) => setGradeFilters({ ...gradeFilters, subjectId: e.target.value })}
            options={(assignments.subjects || []).map(s => ({ value: s._id, label: s.name }))}
          />
          <Select 
            label="Term" 
            value={gradeFilters.term} 
            onChange={(e) => setGradeFilters({ ...gradeFilters, term: e.target.value })}
            options={termOptions}
          />
          <TextInput 
            label="Academic Year" 
            value={gradeFilters.academicYear} 
            onChange={(e) => setGradeFilters({ ...gradeFilters, academicYear: e.target.value })}
            placeholder="2023-2024"
          />
          </div>
          
          {gradesLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
          {grades.length > 0 ? grades.map((grade) => (
            <div key={grade._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{grade.studentId?.userId?.name || grade.studentId?.rollNumber}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{grade.subjectId?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${grade.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {grade.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Term:</span>
                  <span className="ml-1 capitalize">{grade.term}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Marks:</span>
                  <span className="ml-1">{grade.marks}/{grade.maxMarks} ({grade.percentage}%)</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                  <span className="ml-1 font-medium">{grade.grade}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {!grade.isPublished && (
                  <Button 
                    size="sm" 
                    onClick={() => ask({
                      title: 'Publish Grade',
                      message: 'Publish this grade? Students will be able to see it.',
                      onConfirm: () => publishGrade.mutate(grade._id),
                    })}
                    disabled={publishGrade.isPending}
                    className="text-xs"
                  >
                    Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => ask({
                    title: 'Aggregate Term Result',
                    message: 'Aggregate term result from published grades for this student? This will upsert the term result.',
                    onConfirm: () => aggregateTermResult.mutate({
                      studentId: grade.studentId?._id || grade.studentId,
                      classId: grade.classId?._id || grade.classId,
                      term: grade.term,
                      academicYear: grade.academicYear,
                    })
                  })}
                  disabled={aggregateTermResult.isPending}
                  className="text-xs"
                >
                  {aggregateTermResult.isPending ? 'Aggregating...' : 'Aggregate'}
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => ask({
                    title: 'Delete Grade',
                    message: 'Delete this grade? This action cannot be undone.',
                    onConfirm: () => deleteGrade.mutate(grade._id),
                  })}
                  disabled={deleteGrade.isPending}
                  className="text-xs"
                >
                  Delete
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">No grades found</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-auto">
            <table className="min-w-full text-sm">
            <thead>
                <tr>
                  <th className="text-left px-3 py-2">Student</th>
                  <th className="text-left px-3 py-2">Subject</th>
                  <th className="text-left px-3 py-2">Term</th>
                  <th className="text-left px-3 py-2">Marks</th>
                  <th className="text-left px-3 py-2">Grade</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
                {grades.length > 0 ? grades.map((grade) => (
                  <tr key={grade._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{grade.studentId?.userId?.name || grade.studentId?.rollNumber}</td>
                    <td className="px-3 py-2">{grade.subjectId?.name}</td>
                    <td className="px-3 py-2 capitalize">{grade.term}</td>
                    <td className="px-3 py-2">{grade.marks}/{grade.maxMarks} ({grade.percentage}%)</td>
                    <td className="px-3 py-2 font-medium">{grade.grade}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${grade.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {grade.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {!grade.isPublished && (
                          <Button 
                            size="sm" 
                            onClick={() => ask({
                              title: 'Publish Grade',
                              message: 'Publish this grade? Students will be able to see it.',
                              onConfirm: () => publishGrade.mutate(grade._id),
                            })}
                            disabled={publishGrade.isPending}
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => ask({
                            title: 'Aggregate Term Result',
                            message: 'Aggregate term result from published grades for this student? This will upsert the term result.',
                            onConfirm: () => aggregateTermResult.mutate({
                              studentId: grade.studentId?._id || grade.studentId,
                              classId: grade.classId?._id || grade.classId,
                              term: grade.term,
                              academicYear: grade.academicYear,
                            })
                          })}
                          disabled={aggregateTermResult.isPending}
                        >
                          {aggregateTermResult.isPending ? 'Aggregating...' : 'Aggregate Result'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => ask({
                            title: 'Delete Grade',
                            message: 'Delete this grade? This action cannot be undone.',
                            onConfirm: () => deleteGrade.mutate(grade._id),
                          })}
                          disabled={deleteGrade.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                  </td>
                </tr>
                )) : (
                  <tr><td className="px-3 py-4 text-gray-500" colSpan={7}>No grades found</td></tr>
                )}
            </tbody>
          </table>
          </div>
          </>
        )}
      </>
    )
  }

  const renderSummaryTab = () => {
    if (gradesLoading) {
      return <div className="text-center py-8">Loading grade summary...</div>
    }

    return (
      <>
        <div className="mb-4">
          <Banner kind="success">
            Uploaded grades appear here immediately. To reflect in term results seen by students/parents, grades must be <strong>Published</strong> and then aggregated by the term results process. Use "Publish" per grade (View tab) or the button below to publish all drafts in the current filter.
          </Banner>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <span>Filter:</span>
            <span className="ml-2">Class: {gradeFilters.classId || 'All'}</span>
            <span className="ml-3">Subject: {gradeFilters.subjectId || 'All'}</span>
            <span className="ml-3">Term: {gradeFilters.term || 'Any'}</span>
            <span className="ml-3">Year: {gradeFilters.academicYear || 'Any'}</span>
          </div>
          <Button 
            onClick={() => {
              const draftIds = grades.filter(g => !g.isPublished).map(g => g._id)
              if (draftIds.length === 0) {
                try { window?.toast?.info?.('No draft grades to publish for current filter') } catch { /* noop */ }
                return
              }
              ask({
                title: 'Publish All Draft Grades',
                message: `Publish ${draftIds.length} draft grade(s) in the current filter?`,
                onConfirm: () => publishAllDraft.mutate(draftIds)
              })
            }}
            disabled={publishAllDraft.isPending}
            className="w-full sm:w-auto"
          >
            {publishAllDraft.isPending ? 'Publishing...' : 'Publish All Draft Grades'}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Kpi title="Total Grades" value={gradesData?.count || 0} />
          <Kpi title="Published" value={grades.filter(g => g.isPublished).length} />
          <Kpi title="Draft" value={grades.filter(g => !g.isPublished).length} />
          <Kpi title="Average Grade" value={Object.keys(gradesSummary).length > 0 ? 
            Object.entries(gradesSummary).map(([grade, data]) => `${grade}: ${data.count}`).join(', ') : 
            'N/A'
          } />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-medium mb-3">Grade Distribution</h3>
            <div className="space-y-2">
              {Object.entries(gradesSummary).map(([grade, data]) => (
                <div key={grade} className="flex justify_between items-center">
                  <span className="font-medium">Grade {grade}</span>
                  <span>{data.count} students ({Math.round((data.count / grades.length) * 100)}%)</span>
                </div>
              ))}
            </div>
                    </div>
          
          <div>
            <h3 className="font-medium mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {grades.slice(0, 5).map((grade) => (
                <div key={grade._id} className="text-sm">
                  <span className="font-medium">{grade.studentId?.userId?.name}</span> - {grade.subjectId?.name} ({grade.grade})
                  <div className="text-xs text-gray-500">
                    {new Date(grade.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Confirm />
      
      {/* Gradient Header */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify_between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Grades Management</h1>
              <p className="text-white/90 mt-1">Upload, review, and publish student grades for your classes</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => refetchGrades()} disabled={gradesLoading} className="bg-white/20 hover:bg_white/30 text-white w-full sm:w-auto">
                {gradesLoading ? 'Refreshing...' : 'Refresh Grades'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['upload', 'bulk', 'view', 'summary'].map((t) => (
          <button 
            key={t} 
            className={`px-3 py-2 rounded-full border text-sm sm:text-base transition ${tab === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg_white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`} 
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <Section
          title="Upload Single Grade"
          notice={singleMsg ? <div className="px-4 py-2"><Banner kind={singleMsg.kind}>{singleMsg.text}</Banner></div> : null}
        >
          {renderUploadTab()}
        </Section>
      )}

      {tab === 'bulk' && (
        <Section
          title="Bulk Upload Grades"
          notice={bulkMsg ? <div className="px-4 py-2"><Banner kind={bulkMsg.kind}>{bulkMsg.text}</Banner></div> : null}
        >
          {renderBulkTab()}
        </Section>
      )}

      {tab === 'view' && (
        <Section title="My Grades" actions={<Button onClick={() => refetchGrades()} disabled={gradesLoading}>{gradesLoading ? 'Loading...' : 'Refresh'}</Button>}>
          {renderViewTab()}
        </Section>
      )}

      {tab === 'summary' && (
        <Section title="Grade Summary">
          {renderSummaryTab()}
        </Section>
      )}
    </div>
  )
}

export default GradesPage 
