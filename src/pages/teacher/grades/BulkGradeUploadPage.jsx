import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, FileText, Users, CheckCircle, AlertCircle, X, Plus, Trash2 } from 'lucide-react'
import { api } from '../../../lib/axios'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Modal } from '../../../components/ui/Modal'
import { FileUpload } from '../../../components/ui/FileUpload'

export default function BulkGradeUploadPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [uploadMethod, setUploadMethod] = useState('csv') // 'csv' or 'manual'
  const [showManualModal, setShowManualModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [uploadedGrades, setUploadedGrades] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Fetch subjects for dropdown
  const { data: subjects } = useQuery({
    queryKey: ['subjects', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/subjects', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Fetch exams for dropdown
  const { data: exams } = useQuery({
    queryKey: ['exams', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/exams', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Fetch students for selected class
  const { data: students } = useQuery({
    queryKey: ['students', 'class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return []
      const response = await api.get(`/classes/${selectedClass}/students`)
      return response.data
    },
    enabled: !!selectedClass
  })

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: (gradesData) => api.post('/grades/bulk', gradesData),
    onSuccess: () => {
      queryClient.invalidateQueries(['grades'])
      setUploadedGrades([])
      setIsProcessing(false)
    }
  })

  const handleFileUpload = (fileKey, fileName) => {
    // Process the uploaded CSV file
    processCSVFile(fileKey, fileName)
  }

  const processCSVFile = async (fileKey, fileName) => {
    try {
      setIsProcessing(true)
      // In a real implementation, you would fetch the file content and parse it
      // For now, we'll simulate processing
      const mockGrades = generateMockGradesFromCSV()
      setUploadedGrades(mockGrades)
      setShowPreviewModal(true)
    } catch (error) {
      console.error('Failed to process CSV:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateMockGradesFromCSV = () => {
    if (!students) return []
    
    return students.map(student => ({
      studentId: student._id,
      studentName: student.name,
      examId: selectedExam,
      subjectId: selectedSubject,
      score: Math.floor(Math.random() * 100) + 1,
      maxScore: 100,
      percentage: 0,
      grade: '',
      remarks: '',
      isUploaded: false
    }))
  }

  const handleManualEntry = () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      alert('Please select class, subject, and exam first')
      return
    }
    setShowManualModal(true)
  }

  const handleManualGradeSubmit = (grades) => {
    setUploadedGrades(grades)
    setShowManualModal(false)
    setShowPreviewModal(true)
  }

  const handleBulkUpload = async () => {
    if (uploadedGrades.length === 0) return

    try {
      setIsProcessing(true)
      
      const gradesData = {
        classId: selectedClass,
        subjectId: selectedSubject,
        examId: selectedExam,
        grades: uploadedGrades.map(grade => ({
          studentId: grade.studentId,
          score: grade.score,
          maxScore: grade.maxScore,
          remarks: grade.remarks
        }))
      }

      await bulkUploadMutation.mutateAsync(gradesData)
      alert('Grades uploaded successfully!')
      
    } catch (error) {
      console.error('Failed to upload grades:', error)
      alert('Failed to upload grades. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const headers = ['Student ID', 'Student Name', 'Score', 'Max Score', 'Remarks']
    const csvContent = [headers].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'grades-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const updateGrade = (index, field, value) => {
    const updatedGrades = [...uploadedGrades]
    updatedGrades[index] = { ...updatedGrades[index], [field]: value }
    
    // Calculate percentage and grade
    if (field === 'score' || field === 'maxScore') {
      const score = field === 'score' ? value : updatedGrades[index].score
      const maxScore = field === 'maxScore' ? value : updatedGrades[index].maxScore
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
      
      let grade = ''
      if (percentage >= 90) grade = 'A+'
      else if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B+'
      else if (percentage >= 60) grade = 'B'
      else if (percentage >= 50) grade = 'C'
      else if (percentage >= 40) grade = 'D'
      else grade = 'F'
      
      updatedGrades[index].percentage = Math.round(percentage)
      updatedGrades[index].grade = grade
    }
    
    setUploadedGrades(updatedGrades)
  }

  const removeGrade = (index) => {
    setUploadedGrades(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Bulk Grade Upload</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Upload grades for multiple students at once
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">Choose Class</option>
                              {classes?.data?.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">Choose Subject</option>
              {subjects?.data?.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">Choose Exam</option>
                              {exams?.data?.map(exam => (
                <option key={exam._id} value={exam._id}>{exam.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Upload Method
          </label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="csv"
                checked={uploadMethod === 'csv'}
                onChange={(e) => setUploadMethod(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">CSV Upload</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="manual"
                checked={uploadMethod === 'manual'}
                onChange={(e) => setUploadMethod(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Manual Entry</span>
            </label>
          </div>
        </div>

        {/* Upload Area */}
        {uploadMethod === 'csv' ? (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Upload CSV File
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a CSV file with student grades. Make sure to use the template format.
            </p>
            <FileUpload
              category="grade-uploads"
              onUploadComplete={handleFileUpload}
              onUploadError={(error, fileName) => {
                console.error(`Upload failed for ${fileName}:`, error)
              }}
              maxFiles={1}
              acceptedTypes={['text/csv', '.csv']}
            />
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Manual Grade Entry
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter grades manually for each student in the selected class.
            </p>
            <Button
              onClick={handleManualEntry}
              disabled={!selectedClass || !selectedSubject || !selectedExam}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Enter Grades Manually</span>
              <span className="sm:hidden">Manual Entry</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Preview and Upload */}
      {uploadedGrades.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Grades Preview ({uploadedGrades.length} students)
            </h3>
            <Button
              onClick={handleBulkUpload}
              disabled={isProcessing || bulkUploadMutation.isPending}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              {isProcessing || bulkUploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload All Grades</span>
                  <span className="sm:hidden">Upload All</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {uploadedGrades.map((grade, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{grade.studentName}</h3>
                  <button
                    onClick={() => removeGrade(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Score</label>
                    <input
                      type="number"
                      value={grade.score}
                      onChange={(e) => updateGrade(index, 'score', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Score</label>
                    <input
                      type="number"
                      value={grade.maxScore}
                      onChange={(e) => updateGrade(index, 'maxScore', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                    <span className="ml-1 font-medium">{grade.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                    <span className="ml-1 font-medium">{grade.grade}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={grade.remarks}
                    onChange={(e) => updateGrade(index, 'remarks', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">Score</th>
                  <th className="text-left px-4 py-2">Max Score</th>
                  <th className="text-left px-4 py-2">Percentage</th>
                  <th className="text-left px-4 py-2">Grade</th>
                  <th className="text-left px-4 py-2">Remarks</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedGrades.map((grade, index) => (
                  <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 font-medium">{grade.studentName}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={grade.score}
                        onChange={(e) => updateGrade(index, 'score', parseInt(e.target.value) || 0)}
                        className="w-20 p-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={grade.maxScore}
                        onChange={(e) => updateGrade(index, 'maxScore', parseInt(e.target.value) || 0)}
                        className="w-20 p-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{grade.percentage}%</td>
                    <td className="px-4 py-2 font-medium">{grade.grade}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={grade.remarks}
                        onChange={(e) => updateGrade(index, 'remarks', e.target.value)}
                        className="w-32 p-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                        placeholder="Optional"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeGrade(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Manual Grade Entry"
        size="xl"
      >
        <ManualGradeEntry
          students={students || []}
          onSubmit={handleManualGradeSubmit}
          onCancel={() => setShowManualModal(false)}
        />
      </Modal>
    </div>
  )
}

// Manual Grade Entry Component
function ManualGradeEntry({ students, onSubmit, onCancel }) {
  const [grades, setGrades] = useState([])

  useState(() => {
    if (students) {
      setGrades(students.map(student => ({
        studentId: student._id,
        studentName: student.name,
        score: 0,
        maxScore: 100,
        percentage: 0,
        grade: 'F',
        remarks: ''
      })))
    }
  }, [students])

  const updateGrade = (index, field, value) => {
    const updatedGrades = [...grades]
    updatedGrades[index] = { ...updatedGrades[index], [field]: value }
    
    // Calculate percentage and grade
    if (field === 'score' || field === 'maxScore') {
      const score = field === 'score' ? value : updatedGrades[index].score
      const maxScore = field === 'maxScore' ? value : updatedGrades[index].maxScore
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
      
      let grade = ''
      if (percentage >= 90) grade = 'A+'
      else if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B+'
      else if (percentage >= 60) grade = 'B'
      else if (percentage >= 50) grade = 'C'
      else if (percentage >= 40) grade = 'D'
      else grade = 'F'
      
      updatedGrades[index].percentage = Math.round(percentage)
      updatedGrades[index].grade = grade
    }
    
    setGrades(updatedGrades)
  }

  const handleSubmit = () => {
    onSubmit(grades)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Enter grades for {students?.length || 0} students
      </div>
      
      {/* Mobile Card View */}
      <div className="lg:hidden max-h-96 overflow-y-auto space-y-3">
        {grades.map((grade, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{grade.studentName}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Score</label>
                <input
                  type="number"
                  value={grade.score}
                  onChange={(e) => updateGrade(index, 'score', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Score</label>
                <input
                  type="number"
                  value={grade.maxScore}
                  onChange={(e) => updateGrade(index, 'maxScore', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                  min="1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                <span className="ml-1 font-medium">{grade.grade}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Remarks</label>
              <input
                type="text"
                value={grade.remarks}
                onChange={(e) => updateGrade(index, 'remarks', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Student</th>
              <th className="text-left px-4 py-2">Score</th>
              <th className="text-left px-4 py-2">Max Score</th>
              <th className="text-left px-4 py-2">Grade</th>
              <th className="text-left px-4 py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2 font-medium">{grade.studentName}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={grade.score}
                    onChange={(e) => updateGrade(index, 'score', parseInt(e.target.value) || 0)}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    min="0"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={grade.maxScore}
                    onChange={(e) => updateGrade(index, 'maxScore', parseInt(e.target.value) || 0)}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    min="1"
                  />
                </td>
                <td className="px-4 py-2 font-medium">{grade.grade}</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={grade.remarks}
                    onChange={(e) => updateGrade(index, 'remarks', e.target.value)}
                    className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Optional"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="w-full sm:w-auto">
          Submit Grades
        </Button>
      </div>
    </div>
  )
}



