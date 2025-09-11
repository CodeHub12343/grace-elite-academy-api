import { api } from './axios'

// Generic API response handler
const handleResponse = (response) => {
  if (response.data?.success === false) {
    throw new Error(response.data.message || 'API request failed')
  }
  return response.data
}

const handleError = (error) => {
  const message = error.response?.data?.message || error.message || 'Something went wrong'
  throw new Error(message)
}

// Classes API
export const classesApi = {
  getClasses: async (params = {}) => {
    try {
      const response = await api.get('/classes', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getClassById: async (id) => {
    try {
      const response = await api.get(`/classes/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  createClass: async (data) => {
    try {
      const response = await api.post('/classes', data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  updateClass: async (id, data) => {
    try {
      const response = await api.patch(`/classes/${id}`, data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  deleteClass: async (id) => {
    try {
      const response = await api.delete(`/classes/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}

// Subjects API
export const subjectsApi = {
  getSubjects: async (params = {}) => {
    try {
      const response = await api.get('/subjects', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getSubjectById: async (id) => {
    try {
      const response = await api.get(`/subjects/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  createSubject: async (data) => {
    try {
      const response = await api.post('/subjects', data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  updateSubject: async (id, data) => {
    try {
      const response = await api.patch(`/subjects/${id}`, data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  deleteSubject: async (id) => {
    try {
      const response = await api.delete(`/subjects/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}

// Teachers API
export const teachersApi = {
  getTeachers: async (params = {}) => {
    try {
      const response = await api.get('/teachers', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getCurrentTeacher: async () => {
    try {
      const response = await api.get('/teachers/me')
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getTeacherById: async (id) => {
    try {
      const response = await api.get(`/teachers/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  createTeacher: async (data) => {
    try {
      const response = await api.post('/teachers', data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  updateTeacher: async (id, data) => {
    try {
      const response = await api.patch(`/teachers/${id}`, data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  deleteTeacher: async (id) => {
    try {
      const response = await api.delete(`/teachers/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}

// Students API
export const studentsApi = {
  getStudents: async (params = {}) => {
    try {
      const response = await api.get('/students', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getStudentById: async (id) => {
    try {
      const response = await api.get(`/students/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  createStudent: async (data) => {
    try {
      const response = await api.post('/students', data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  updateStudent: async (id, data) => {
    try {
      const response = await api.patch(`/students/${id}`, data)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  deleteStudent: async (id) => {
    try {
      const response = await api.delete(`/students/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}

// Reports API
export const reportsApi = {
  getGeneralReports: async (params = {}) => {
    try {
      const response = await api.get('/reports', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getStudentReport: async (id) => {
    try {
      const response = await api.get(`/reports/student/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getClassReport: async (id) => {
    try {
      const response = await api.get(`/reports/class/${id}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getFinanceReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/finance', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getExamAnalytics: async (examId) => {
    try {
      const response = await api.get(`/reports/exams/${examId}`)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getAttendanceSummary: async (classId, params = {}) => {
    try {
      const response = await api.get(`/reports/attendance/class/${classId}`, { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getStudentAcademicResult: async (studentId, params = {}) => {
    try {
      const response = await api.get(`/reports/student/${studentId}/academic-result`, { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}

// Attendance API
export const attendanceApi = {
  markAttendance: async (payload) => {
    try {
      const response = await api.post('/attendance/mark', payload)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
  markBulk: async (payload) => {
    try {
      // Use the existing mark endpoint for bulk operations
      const response = await api.post('/attendance/mark', payload)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
  updateAttendance: async (payload) => {
    try {
      const response = await api.post('/attendance/mark', payload)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
  getClassAttendance: async (classId, params = {}) => {
    try {
      const response = await api.get(`/attendance/class/${classId}`, { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
  getStudentAttendance: async (studentId, params = {}) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}`, { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
  getAttendanceReport: async (params = {}) => {
    try {
      const response = await api.get('/attendance/report', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },
}

// Assignments API
export const assignmentsApi = {
  create: async (data) => {
    try {
      const response = await api.post('/assignments', data)
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
  list: async (params = {}) => {
    try {
      const response = await api.get('/assignments', { params })
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
  presign: async (data) => {
    try {
      const response = await api.post('/assignments/presign', data)
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
  submit: async (data) => {
    try {
      const response = await api.post('/assignments/submit', data)
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
  submissionsFor: async (assignmentId, params = {}) => {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submissions`, { params })
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
  gradeSubmission: async (id, data) => {
    try {
      const response = await api.patch(`/assignments/submissions/${id}/grade`, data)
      return handleResponse(response)
    } catch (error) { handleError(error) }
  },
}

// Grades API
export const gradesApi = {
  list: async (params = {}) => { try { return handleResponse(await api.get('/grades', { params })) } catch (e) { handleError(e) } },
  create: async (data) => { try { return handleResponse(await api.post('/grades', data)) } catch (e) { handleError(e) } },
  bulkCreate: async (data) => { try { return handleResponse(await api.post('/grades/bulk', data)) } catch (e) { handleError(e) } },
  student: async (studentId, params = {}) => { try { return handleResponse(await api.get(`/grades/student/${studentId}`, { params })) } catch (e) { handleError(e) } },
  class: async (classId, params = {}) => { try { return handleResponse(await api.get(`/grades/class/${classId}`, { params })) } catch (e) { handleError(e) } },
  teacher: async (subjectId, classId, params = {}) => { try { return handleResponse(await api.get(`/grades/teacher/subject/${subjectId}/class/${classId}`, { params })) } catch (e) { handleError(e) } },
  update: async (id, data) => { try { return handleResponse(await api.put(`/grades/${id}`, data)) } catch (e) { handleError(e) } },
  delete: async (id) => { try { return handleResponse(await api.delete(`/grades/${id}`)) } catch (e) { handleError(e) } },
}

// Reviews API
export const reviewsApi = {
  create: async (data) => { try { return handleResponse(await api.post('/reviews', data)) } catch (e) { handleError(e) } },
  teacher: async (teacherId, params = {}) => { try { return handleResponse(await api.get(`/reviews/teacher/${teacherId}`, { params })) } catch (e) { handleError(e) } },
  mine: async (params = {}) => { try { return handleResponse(await api.get('/reviews/my', { params })) } catch (e) { handleError(e) } },
  analytics: async (params = {}) => { try { return handleResponse(await api.get('/reviews/analytics', { params })) } catch (e) { handleError(e) } },
  delete: async (id) => { try { return handleResponse(await api.delete(`/reviews/${id}`)) } catch (e) { handleError(e) } },
}

// Exams (teacher) API
export const examsApi = {
  list: async (params = {}) => { try { return handleResponse(await api.get('/exams', { params })) } catch (e) { handleError(e) } },
  createExam: async (data) => { try { return handleResponse(await api.post('/exams', data)) } catch (e) { handleError(e) } },
  create: async (data) => { try { return handleResponse(await api.post('/exams', data)) } catch (e) { handleError(e) } },
  update: async (id, data) => { try { return handleResponse(await api.put(`/exams/${id}`, data)) } catch (e) { handleError(e) } },
  updateExamStatus: async (id, status) => { try { return handleResponse(await api.patch(`/exams/${id}/status`, { status })) } catch (e) { handleError(e) } },
  status: async (id, data) => { try { return handleResponse(await api.patch(`/exams/${id}/status`, data)) } catch (e) { handleError(e) } },
  addQuestions: async (id, questions) => { try { return handleResponse(await api.post(`/exams/${id}/questions`, { questions })) } catch (e) { handleError(e) } },
  get: async (id) => { try { return handleResponse(await api.get(`/exams/${id}`)) } catch (e) { handleError(e) } },
  delete: async (id) => { try { return handleResponse(await api.delete(`/exams/${id}`)) } catch (e) { handleError(e) } },
  exportResults: async (params = {}) => {
    try {
      const isCsv = (params?.format || '').toLowerCase() === 'csv'
      const response = await api.get('/exams/results', { params, responseType: isCsv ? 'blob' : 'json' })
      return isCsv ? response.data : handleResponse(response)
    } catch (e) { handleError(e) }
  },
}

// Questions bank API (teacher)
export const questionsApi = {
  bank: async (params = {}) => {
    try {
      const response = await api.get('/questions/bank', { params })
      return handleResponse(response)
    } catch (e) { handleError(e) }
  },
  create: async (data) => {
    try {
      const response = await api.post('/questions', data)
      return handleResponse(response)
    } catch (e) { handleError(e) }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/questions/${id}`, data)
      return handleResponse(response)
    } catch (e) { handleError(e) }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/questions/${id}`)
      return handleResponse(response)
    } catch (e) { handleError(e) }
  },
}

// CBT (student) API
export const cbtApi = {
  getQuestions: async (examId) => { try { return handleResponse(await api.get(`/cbt/exams/${examId}/questions`)) } catch (e) { handleError(e) } },
  submit: async (examId, payload) => { try { return handleResponse(await api.post(`/cbt/exams/${examId}/submit`, payload)) } catch (e) { handleError(e) } },
  myResult: async (examId) => { try { return handleResponse(await api.get(`/cbt/results/student/${examId}`)) } catch (e) { handleError(e) } },
  classResults: async (examId) => { try { return handleResponse(await api.get(`/cbt/results/class/${examId}`)) } catch (e) { handleError(e) } },
}

// Fees v2 + Payments API
export const feesApi = {
  // Admin: create fee entry for a student or class (v2)
  create: async (data) => { try { return handleResponse(await api.post('/fees', data)) } catch (e) { handleError(e) } },
  // Student/Admin: list fees for a student (enriched with dynamic late fee)
  forStudent: async (studentId) => {
    try {
      // Prefer v2 route if available
      return handleResponse(await api.get(`/v2/fees/student/${studentId}`))
    } catch {
      try {
        // Fallback to v1 route
        return handleResponse(await api.get(`/fees/student/${studentId}`))
      } catch (e) { handleError(e) }
    }
  },
}

export const paymentsApi = {
  // Low-level proxy (matches user's minimal helper semantics)
  post: async (path, body) => {
    try {
      return handleResponse(await api.post(path, body))
    } catch (e) { handleError(e) }
  },
  // Student: initiate Paystack payment, returns authorization_url and reference
  initiate: async ({ studentId, feeId, amount }) => {
    try {
      return handleResponse(await api.post('/payments/initiate', { studentId, feeId, amount }))
    } catch (e) { handleError(e) }
  },
  // Student: initiate Paystack payment (v2 path) - forwards any extra fields
  initiateV2: async (payload) => {
    try {
      return handleResponse(await api.post('/v2/payments/initiate', payload))
    } catch (e) { handleError(e) }
  },
  // Optional (v1): verify by reference if backend exposes it
  verify: async (reference) => { try { return handleResponse(await api.get(`/payments/verify/${reference}`)) } catch (e) { handleError(e) } },
  // Admin/Student: get payment history for a student
  history: async (studentId, params = {}) => {
    try {
      return handleResponse(await api.get(`/payments/student/${studentId}`, { params }))
    } catch (e) { handleError(e) }
  },
  // Admin: get payment analytics
  analytics: async (params = {}) => {
    try {
      return handleResponse(await api.get('/payments/analytics', { params }))
    } catch (e) { handleError(e) }
  },
  // Admin-only (dev): simulate webhook success
  simulateWebhook: async ({ reference, secret }) => {
    try {
      return handleResponse(await api.post('/payments/simulate-webhook', { reference, secret }))
    } catch (e) { handleError(e) }
  },
}

// Admin (v1): Fee categories and invoices helpers
export const financeAdminApi = {
  // Categories
  createCategory: async (data) => { try { return handleResponse(await api.post('/fees/categories', data)) } catch (e) { handleError(e) } },
  listCategories: async (params = {}) => { try { return handleResponse(await api.get('/fees/categories', { params })) } catch (e) { handleError(e) } },
  // Invoices
  createInvoices: async (data) => { try { return handleResponse(await api.post('/fees/invoices', data)) } catch (e) { handleError(e) } },
  listInvoices: async (params = {}) => { try { return handleResponse(await api.get('/fees/invoices', { params })) } catch (e) { handleError(e) } },
  getInvoice: async (id) => { try { return handleResponse(await api.get(`/fees/invoices/${id}`)) } catch (e) { handleError(e) } },
}

// Notifications API
export const notificationsApi = {
  list: async (params = {}) => {
    try {
      const userId = params.userId
      if (!userId) throw new Error('userId is required for notifications.list')
      const response = await api.get(`/notifications/user/${userId}`)
      return handleResponse(response)
    } catch (e) { handleError(e) }
  },
  markRead: async (id) => { try { return handleResponse(await api.patch(`/notifications/${id}/read`)) } catch (e) { handleError(e) } },
  // Backend does not expose a read-all endpoint; provide a safe no-op to avoid 404s
  markAllRead: async () => { return { success: true, data: { updated: 0 } } },
  send: async (payload) => { try { return handleResponse(await api.post('/notifications/send', payload)) } catch (e) { handleError(e) } },
  bulk: async (payload) => { try { return handleResponse(await api.post('/notifications/bulk', payload)) } catch (e) { handleError(e) } },
}

// Files API (S3 presign/confirm, list, delete)
export const filesApi = {
  presignUpload: async (payload) => { try { return handleResponse(await api.post('/files/upload-url', payload)) } catch (e) { handleError(e) } },
  confirmUpload: async (fileKey) => { try { return handleResponse(await api.patch(`/files/confirm/${encodeURIComponent(fileKey)}`)) } catch (e) { handleError(e) } },
  list: async (params = {}) => { try { return handleResponse(await api.get('/files', { params })) } catch (e) { handleError(e) } },
  remove: async (idOrKey) => { try { return handleResponse(await api.delete(`/files/${encodeURIComponent(idOrKey)}`)) } catch (e) { handleError(e) } },
}

// Term Results API
export const termResultsApi = {
  // Admin: Upload single term result
  upload: async (data) => { try { return handleResponse(await api.post('/term-results/upload', data)) } catch (e) { handleError(e) } },
  // Admin: Bulk upload term results
  bulkUpload: async (data) => { try { return handleResponse(await api.post('/term-results/bulk-upload', data)) } catch (e) { handleError(e) } },
  // Admin/Teacher/Student: Get student term results
  getStudentResults: async (studentId, params = {}) => { try { return handleResponse(await api.get(`/term-results/student/${studentId}`, { params })) } catch (e) { handleError(e) } },
  // Admin/Teacher: Get class term results
  getClassResults: async (classId, params = {}) => { try { return handleResponse(await api.get(`/term-results/class/${classId}`, { params })) } catch (e) { handleError(e) } },
  // Admin: Publish term result
  publish: async (id) => { try { return handleResponse(await api.patch(`/term-results/${id}/publish`, {})) } catch (e) { handleError(e) } },
  // Admin/Teacher: Aggregate from teacher grades (upsert + optional publish)
  aggregateFromTeacherGrades: async ({ studentId, classId, term, academicYear, publish = true }) => {
    try { return handleResponse(await api.post('/term-results/publish', { studentId, classId, term, academicYear, publish })) } catch (e) { handleError(e) }
  },
  // Admin: Delete term result
  delete: async (id) => { try { return handleResponse(await api.delete(`/term-results/${id}`)) } catch (e) { handleError(e) } },
}

// Teacher Attendance API
export const teacherAttendanceApi = {
  // Admin: mark one teacher
  mark: async ({ teacherId, date, status, remarks }) => {
    try { return handleResponse(await api.post('/teacher-attendance/mark', { teacherId, date, status, remarks })) } catch (e) { handleError(e) }
  },
  // Admin: bulk mark
  bulk: async ({ date, records }) => {
    try { return handleResponse(await api.post('/teacher-attendance/bulk', { date, records })) } catch (e) { handleError(e) }
  },
  // Admin: list with filters
  list: async (params = {}) => {
    try { return handleResponse(await api.get('/teacher-attendance', { params })) } catch (e) { handleError(e) }
  },
  // Teacher: my own attendance
  mine: async (params = {}) => {
    try { return handleResponse(await api.get('/teacher-attendance/me', { params })) } catch (e) { handleError(e) }
  },
}

export const teacherGradesApi = {
  // Teacher dashboard endpoints
  getMyAssignments: () => api.get('/teacher-grades/my-assignments'),
  getMyGrades: (params) => api.get('/teacher-grades/my-grades', { params }),

  // Teacher grade management endpoints
  uploadGrade: (data) => api.post('/teacher-grades/upload', data),
  bulkUploadGrades: (data) => api.post('/teacher-grades/bulk-upload', data),
  getClassSubjectGrades: (classId, subjectId, params) => api.get(`/teacher-grades/class/${classId}/subject/${subjectId}`, { params }),
  publishGrade: (id) => api.patch(`/teacher-grades/${id}/publish`),
  deleteGrade: (id) => api.delete(`/teacher-grades/${id}`),

  // Student comprehensive grades endpoint
  getStudentComprehensiveGrades: (studentId, params) => api.get(`/teacher-grades/student/${studentId}`, { params }),
}

// Teacher Results API
export const teacherResultsApi = {
  // Get results for a specific class, subject, term, and academic year
  getResults: async (params = {}) => {
    try {
      const response = await api.get('/teacher-results/results', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  // Export results as CSV
  exportResults: async (params = {}) => {
    try {
      const response = await api.get('/teacher-results/export', { 
        params,
        responseType: 'blob' // For file download
      })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
}

// Admin Analytics API
export const adminAnalyticsApi = {
  getDashboardOverview: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/dashboard', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getAcademicPerformance: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/academic/performance', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getFinancialOverview: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/financial/overview', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getAttendanceOverview: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/attendance/overview', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getTeacherPerformance: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/teachers/performance', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getStudentLifecycle: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/students/lifecycle', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getPredictiveForecasts: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/predictive/forecasts', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  getRealtimeMetrics: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/realtime/metrics', { params })
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  },

  exportComprehensiveReport: async (params = {}) => {
    try {
      const response = await api.get('/admin-analytics/export/comprehensive', { 
        params,
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  executeCustomQuery: async (queryData) => {
    try {
      const response = await api.post('/admin-analytics/custom/query', queryData)
      return handleResponse(response)
    } catch (error) {
      handleError(error)
    }
  }
}
