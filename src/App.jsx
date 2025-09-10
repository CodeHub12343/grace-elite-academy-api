import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AdminLayout } from './components/layout/AdminLayout'
import { TeacherLayout } from './components/layout/TeacherLayout'
import { StudentLayout } from './components/layout/StudentLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import FilesPage from './pages/admin/FilesPage'
import { ClassesSubjectsPage } from './pages/teacher/ClassesSubjectsPage'
import AdminAttendancePage from './pages/admin/AttendancePage'
import AdminCBTPage from './pages/admin/CBTPage'
import AdminNotificationsPage from './pages/admin/NotificationsPage'
import AdminReportsHostPage from './pages/admin/ReportsPage'
import AdminSettingsPage from './pages/admin/SettingsPage'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'
import { ClassesPage } from './pages/teacher/ClassesPage'
import { TeacherStudentsPage } from './pages/teacher/StudentsPage'
import { AttendancePage as TeacherAttendancePage } from './pages/teacher/AttendancePage'
import { TeacherAssignmentsPage as AssignmentsPage } from './pages/teacher/AssignmentsPage'
import TeacherFilesPage from './pages/teacher/FilesPage'
import { TeacherCBTPage } from './pages/teacher/CBTPage'
import { GradesPage } from './pages/teacher/GradesPage'
import TeacherResultsPage from './pages/teacher/TeacherResultsPage'
import TeacherNotificationsPage from './pages/teacher/NotificationsPage'
import QuestionBankPage from './pages/teacher/cbt/QuestionBankPage'
import ExamWizard from './pages/teacher/cbt/ExamWizard'
import ExamAnalyticsPage from './pages/teacher/cbt/ExamAnalyticsPage'
import ResultExportPage from './pages/teacher/cbt/ResultExportPage'
import BulkGradeUploadPage from './pages/teacher/grades/BulkGradeUploadPage'
import GradeAnalyticsPage from './pages/teacher/grades/GradeAnalyticsPage'
import GradeExportPage from './pages/teacher/grades/GradeExportPage'
import BulkAttendancePage from './pages/teacher/attendance/BulkAttendancePage'
import AttendanceAnalyticsPage from './pages/teacher/attendance/AttendanceAnalyticsPage'
import AttendanceReportsPage from './pages/teacher/attendance/AttendanceReportsPage'
import TeacherReviewDashboardPage from './pages/teacher/TeacherReviewDashboardPage'
import ReviewAnalyticsPage from './pages/teacher/ReviewAnalyticsPage'
import { TeacherSettingsPage } from './pages/teacher/SettingsPage'
import { TeacherSubjectsPage } from './pages/teacher/SubjectsPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { StudentClassesPage } from './pages/student/ClassesPage'
import { StudentSubjectsPage } from './pages/student/SubjectsPage'
import { StudentAssignmentsPage } from './pages/student/AssignmentsPage'
import { StudentAttendancePage } from './pages/student/AttendancePage'
import { StudentExamsPage } from './pages/student/ExamsPage'
import { StudentGradesPage } from './pages/student/GradesPage'
import { StudentFeesPage } from './pages/student/FeesPage'
import { StudentNotificationsPage } from './pages/student/NotificationsPage'
import { StudentSettingsPage } from './pages/student/SettingsPage'
import { ExamAttemptPage } from './pages/student/ExamAttemptPage'
import ExamResultsPage from './pages/student/ExamResultsPage'
import { SignupPage } from './pages/auth/SignupPage'
import { SigninPage } from './pages/auth/SigninPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ProfileUpdatePage from './pages/auth/ProfileUpdatePage'
import AdminClassesPage from './pages/admin/ClassesPage'
import { ClassDetailPage } from './pages/admin/ClassDetailPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import { SubjectDetailPage } from './pages/admin/SubjectDetailPage'
import AdminTeachersPage from './pages/admin/TeachersPage'
import { TeacherDetailPage } from './pages/admin/TeacherDetailPage'
import AdminStudentsPage from './pages/admin/StudentsPage'
import { StudentDetailPage } from './pages/admin/StudentDetailPage'
import { RequireAuth, PublicOnly } from './components/RequireAuth'
import { GradesPage as AdminGradesPage } from './pages/admin/GradesPage'
import { ReviewsPage as AdminReviewsPage } from './pages/admin/ReviewsPage'
import PaymentManagementPage from './pages/admin/PaymentManagementPage'
import { StudentReportPage } from './pages/reports/StudentReportPage'
import { ClassReportPage } from './pages/reports/ClassReportPage'
import { AttendanceReportPage } from './pages/reports/AttendanceReportPage'
import { ExamsAnalyticsPage } from './pages/reports/ExamsAnalyticsPage'
import { StudentReviewsPage } from './pages/student/ReviewsPage'
import ReviewSubmissionPage from './pages/student/ReviewSubmissionPage'
import StudentTermResultsPage from './pages/student/TermResultsPage'
import { TeacherReviewsPage } from './pages/teacher/ReviewsPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RoleRedirect } from './components/RoleRedirect'
import FinancePage from './pages/admin/FinancePage'
import TermResultsPage from './pages/admin/TermResultsPage'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/dashboard" element={<RoleRedirect />} />
        <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><SigninPage /></PublicOnly>} />
        <Route path="/auth/signin" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
        <Route path="/profile" element={<RequireAuth roles={['admin', 'teacher', 'student']}><ProfileUpdatePage /></RequireAuth>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/admin/*" element={<Navigate to="/a" replace />} />

        <Route path="/a" element={<RequireAuth roles={['admin']}><AdminLayout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="teachers/:id" element={<TeacherDetailPage />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="classes/:id" element={<ClassDetailPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:id" element={<SubjectDetailPage />} />
          <Route path="classes-subjects" element={<ClassesSubjectsPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="cbt" element={<AdminCBTPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="payments" element={<PaymentManagementPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="reports" element={<AdminReportsHostPage />} />
          <Route path="reports/student" element={<StudentReportPage />} />
          <Route path="reports/class" element={<ClassReportPage />} />
          <Route path="reports/attendance" element={<AttendanceReportPage />} />
          <Route path="reports/exams" element={<ExamsAnalyticsPage />} />
          <Route path="grades-report" element={<AdminGradesPage />} />
          <Route path="term-results" element={<TermResultsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="/t" element={<RequireAuth roles={['teacher']}><TeacherLayout /></RequireAuth>}>
          <Route index element={<TeacherDashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="subjects" element={<TeacherSubjectsPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="attendance/bulk" element={<BulkAttendancePage />} />
          <Route path="attendance/analytics" element={<AttendanceAnalyticsPage />} />
          <Route path="attendance/reports" element={<AttendanceReportsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="files" element={<TeacherFilesPage />} />
          <Route path="cbt" element={<TeacherCBTPage />} />
          <Route path="cbt/create" element={<ExamWizard />} />
          <Route path="cbt/question-bank" element={<QuestionBankPage />} />
          <Route path="cbt/analytics" element={<ExamAnalyticsPage />} />
          <Route path="cbt/export" element={<ResultExportPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="grades/bulk-upload" element={<BulkGradeUploadPage />} />
          <Route path="grades/analytics" element={<GradeAnalyticsPage />} />
          <Route path="grades/export" element={<GradeExportPage />} />
          <Route path="results" element={<TeacherResultsPage />} />
          <Route path="reviews" element={<TeacherReviewsPage />} />
          <Route path="reviews/dashboard" element={<TeacherReviewDashboardPage />} />
          <Route path="reviews/analytics" element={<ReviewAnalyticsPage />} />
          <Route path="notifications" element={<TeacherNotificationsPage />} />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>

        <Route path="/s" element={<RequireAuth roles={['student']}><StudentLayout /></RequireAuth>}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="classes" element={<StudentClassesPage />} />
          <Route path="subjects" element={<StudentSubjectsPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="exams" element={<StudentExamsPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="term-results" element={<StudentTermResultsPage />} />
          <Route path="reviews" element={<StudentReviewsPage />} />
          <Route path="reviews/submit" element={<ReviewSubmissionPage />} />
          <Route path="fees" element={<StudentFeesPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path="exams/:id/attempt" element={<ExamAttemptPage />} />
          <Route path="exams/:id/results" element={<ExamResultsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App