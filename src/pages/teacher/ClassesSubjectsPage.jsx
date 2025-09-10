import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi, subjectsApi, teachersApi } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function ClassesSubjectsPage() {
  const qc = useQueryClient()
  const { data: classes } = useQuery({ queryKey: ['classes','all'], queryFn: () => classesApi.getClasses({ limit: 1000 }) })
  const { data: subjects } = useQuery({ queryKey: ['subjects','all'], queryFn: () => subjectsApi.getSubjects({ limit: 1000 }) })
  const { data: teachers } = useQuery({ queryKey: ['teachers','all'], queryFn: () => teachersApi.getTeachers({ limit: 1000 }) })

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([])
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])

  const selectedClass = useMemo(() => (classes?.data || []).find(c => c._id === selectedClassId) || null, [classes, selectedClassId])

  // Initialize pickers from selected class
  const initFromClass = () => {
    if (!selectedClass) return
    setSelectedSubjectIds((selectedClass.subjectIds || []).map(s => s._id || s))
    setSelectedTeacherIds((selectedClass.teacherIds || []).map(t => t._id || t))
  }

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classesApi.updateClass(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }) }
  })

  const handleSave = () => {
    if (!selectedClassId) return
    updateClassMutation.mutate({ id: selectedClassId, data: { subjectIds: selectedSubjectIds, teacherIds: selectedTeacherIds } })
  }

  const toggle = (arr, setArr, id) => setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Class ↔ Subjects ↔ Teachers</h1>
        <Button onClick={handleSave} disabled={!selectedClassId || updateClassMutation.isPending} className="w-full sm:w-auto">
          {updateClassMutation.isPending ? 'Saving...' : 'Save Mapping'}
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Class</label>
            <select className="w-full px-3 py-2 rounded border text-sm" value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setTimeout(initFromClass, 0) }}>
              <option value="">Select class</option>
              {(classes?.data || []).map(c => <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Subjects</label>
            <div className="max-h-48 sm:max-h-64 overflow-auto rounded border p-2 space-y-1">
              {(subjects?.data || []).map(s => (
                <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                  <input type="checkbox" checked={selectedSubjectIds.includes(s._id)} onChange={() => toggle(selectedSubjectIds, setSelectedSubjectIds, s._id)} className="rounded" />
                  <span className="truncate">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Teachers</label>
            <div className="max-h-48 sm:max-h-64 overflow-auto rounded border p-2 space-y-1">
              {(teachers?.data || []).map(t => (
                <label key={t._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                  <input type="checkbox" checked={selectedTeacherIds.includes(t._id)} onChange={() => toggle(selectedTeacherIds, setSelectedTeacherIds, t._id)} className="rounded" />
                  <span className="truncate">{t.userId?.name || t._id}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {selectedClass && (
        <Card className="p-4 sm:p-6">
          <div className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Preview</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedClass.name}{selectedClass.section ? ` - ${selectedClass.section}` : ''}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Subjects</div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {(selectedSubjectIds || []).length} selected
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Teachers</div>
              <div className="text-sm font-medium text-green-900 dark:text-green-100">
                {(selectedTeacherIds || []).length} selected
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}






