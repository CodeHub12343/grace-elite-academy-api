import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, BookOpen, Edit, Trash2, Copy, Eye, Download, Upload } from 'lucide-react'
import { api } from '../../../lib/axios'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Modal } from '../../../components/ui/Modal'
import { FileUpload } from '../../../components/ui/FileUpload'

export default function QuestionBankPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  // Form state for creating/editing questions
  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'mcq',
    subject: '',
    topic: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    tags: [],
    points: 1
  })

  // Fetch questions
  const { data: questions, isLoading, error: questionsError } = useQuery({
    queryKey: ['questions', 'bank'],
    queryFn: async () => {
      const response = await api.get('/questions/bank')
      return response.data
    }
  })

  // Fetch subjects for dropdown
  const { data: subjects } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: async () => {
      const response = await api.get('/subjects')
      return response.data
    }
  })

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: (questionData) => api.post('/questions', questionData),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', 'bank'])
      setShowCreateModal(false)
      resetForm()
    }
  })

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', 'bank'])
      setSelectedQuestion(null)
      resetForm()
    }
  })

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', 'bank'])
    }
  })

  // Import questions mutation
  const importQuestionsMutation = useMutation({
    mutationFn: (fileData) => api.post('/questions/import', fileData),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', 'bank'])
      setShowImportModal(false)
    }
  })

  const resetForm = () => {
    setQuestionForm({
      question: '',
      type: 'mcq',
      subject: '',
      topic: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      tags: [],
      points: 1
    })
  }

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setQuestionForm({
      question: question.question,
      type: question.type,
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
      options: question.options || ['', '', '', ''],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      tags: question.tags || [],
      points: question.points || 1
    })
    setShowCreateModal(true)
  }

  const handleSubmit = () => {
    // Validate required fields
    if (!questionForm.question.trim()) {
      alert('Question text is required')
      return
    }
    if (!questionForm.subject) {
      alert('Subject is required')
      return
    }
    
    const questionData = {
      ...questionForm,
      options: questionForm.type === 'mcq' ? questionForm.options : undefined
    }

    if (selectedQuestion) {
      if (!selectedQuestion._id) {
        alert('Invalid question ID for editing')
        return
      }
      updateQuestionMutation.mutate({ id: selectedQuestion._id, data: questionData })
    } else {
      createQuestionMutation.mutate(questionData)
    }
  }

  const handleImportQuestions = (fileKey, fileName) => {
    if (!fileKey || !fileName) {
      alert('Invalid file data for import')
      return
    }
    importQuestionsMutation.mutate({ fileKey, fileName })
  }

  const handleExportQuestions = () => {
    const filteredQuestions = getFilteredQuestions()
    if (!filteredQuestions || filteredQuestions.length === 0) {
      alert('No questions to export')
      return
    }
    const csvContent = convertToCSV(filteredQuestions)
    downloadCSV(csvContent, 'question-bank.csv')
  }

  // Helper function to safely get questions array
  const getQuestionsArray = () => {
    if (!questions) return []
    const questionsArray = Array.isArray(questions) ? questions : questions?.data || []
    // Ensure we always return an array
    return Array.isArray(questionsArray) ? questionsArray : []
  }

  const getFilteredQuestions = () => {
    const questionsArray = getQuestionsArray()
    
    // Additional safety check to ensure each question is a valid object
    const validQuestions = questionsArray.filter(q => q && typeof q === 'object')
    
    return validQuestions.filter(question => {
      const matchesSearch = question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = filterSubject === 'all' || question.subject === filterSubject
      const matchesType = filterType === 'all' || question.type === filterType
      const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty
      
      return matchesSearch && matchesSubject && matchesType && matchesDifficulty
    })
  }

  // Debug: Log the questions data structure
  useEffect(() => {
    if (questions) {
      console.log('Questions data structure:', questions)
      console.log('Questions is array:', Array.isArray(questions))
      console.log('Questions.data is array:', Array.isArray(questions?.data))
      console.log('getQuestionsArray() result:', getQuestionsArray())
    }
  }, [questions])

  const convertToCSV = (questions) => {
    const headers = ['Question', 'Type', 'Subject', 'Topic', 'Difficulty', 'Options', 'Correct Answer', 'Explanation', 'Points']
    const rows = questions.map(q => [
      q.question || '',
      q.type || '',
      q.subject || '',
      q.topic || '',
      q.difficulty || '',
      q.options?.join('|') || '',
      q.correctAnswer || '',
      q.explanation || '',
      q.points || ''
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '📝'
      case 'true_false': return '✅'
      case 'short_answer': return '✏️'
      case 'essay': return '📄'
      default: return '❓'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredQuestions = getFilteredQuestions()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Create, organize, and manage questions for your exams
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportQuestions}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            onClick={() => {
              setSelectedQuestion(null)
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Questions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {getQuestionsArray().length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">MCQ Questions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {getQuestionsArray().filter(q => q && q.type === 'mcq').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Subjects</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const subjects = getQuestionsArray().filter(q => q && q.subject).map(q => q.subject)
                  return new Set(subjects).size
                })()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Topics</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const topics = getQuestionsArray().filter(q => q && q.topic).map(q => q.topic)
                  return new Set(topics).size
                })()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Subjects</option>
              {subjects?.data?.map(subject => (
                <option key={subject._id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
            
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {questionsError ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error loading questions: {questionsError.message}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {getQuestionsArray().length === 0 ? 'No questions created yet' : 'No questions match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-3"
              >
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{getQuestionTypeIcon(question.type || 'mcq')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {question.question || 'No question text'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                      <span className="text-xs text-gray-500">{question.subject || 'No subject'}</span>
                      <span className="text-xs text-gray-500">{question.topic || 'No topic'}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty || 'medium')}`}>
                        {question.difficulty || 'medium'}
                      </span>
                      <span className="text-xs text-gray-500">{question.points || 1} pts</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end sm:justify-start space-x-2">
                  <button
                    onClick={() => question._id ? handleEditQuestion(question) : alert('Invalid question ID')}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => question._id ? deleteQuestionMutation.mutate(question._id) : alert('Invalid question ID')}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Question Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={selectedQuestion ? 'Edit Question' : 'Create New Question'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Type
              </label>
              <select
                value={questionForm.type}
                onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={questionForm.subject}
                onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Subject</option>
                {subjects?.data?.map(subject => (
                  <option key={subject._id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={questionForm.topic}
                onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Algebra, Photosynthesis, World War II"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={questionForm.difficulty}
                onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question
            </label>
            <textarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Enter your question here..."
            />
          </div>

          {questionForm.type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={questionForm.correctAnswer === index}
                      onChange={() => setQuestionForm({ ...questionForm, correctAnswer: index })}
                      className="text-primary focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options]
                        newOptions[index] = e.target.value
                        setQuestionForm({ ...questionForm, options: newOptions })
                      }}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                min="1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Explain why this answer is correct..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!questionForm.question || !questionForm.subject || createQuestionMutation.isPending || updateQuestionMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createQuestionMutation.isPending || updateQuestionMutation.isPending ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Questions Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Questions"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Upload CSV File
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a CSV file with questions. The file should have columns: Question, Type, Subject, Topic, Difficulty, Options, Correct Answer, Explanation, Points
            </p>
            <FileUpload
              category="question-imports"
              onUploadComplete={handleImportQuestions}
              onUploadError={(error, fileName) => {
                console.error(`Import failed for ${fileName}:`, error)
              }}
              maxFiles={1}
              acceptedTypes={['text/csv', '.csv']}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowImportModal(false)}
              className="w-full sm:w-auto"
            >
              Import Complete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}





