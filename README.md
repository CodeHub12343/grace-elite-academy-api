School Management Frontend System

A modern, responsive School Management frontend built with React, Tailwind CSS, and @tanstack/react-query. It provides rich workflows for Admin, Teacher, and Student roles including classes, subjects, attendance, grades, CBT exams, fees/payments, analytics, notifications, and files.

Features

- Responsive design across all major pages (admin/teacher/student)
- Role-based layouts and routing
- Data fetching and caching with React Query
- Forms with validation (react-hook-form + zod in places)
- Realtime notifications via WebSocket (with planned payment:success listener)
- Payments (Paystack) integration including admin simulation endpoint
- Charts (recharts) for analytics and performance
- Rich tables with mobile card views
- Bulk operations (attendance and grades)
- Exam/CBT management with question bank and export

Tech Stack

- React 18, Vite
- Tailwind CSS
- @tanstack/react-query
- react-hook-form, zod
- recharts
- framer-motion (animations)
- socket.io-client (notifications)
- Axios

Monorepo Context

This repo focuses on the frontend, but includes a small backend-context (routes and controllers) showcasing new payments simulation endpoints used during development/testing. The real backend runs separately (see your backend repository).

Getting Started

1) Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (defaults to http://localhost:5000/api)

2) Install
```
npm install
```

3) Configure environment
Create a .env (or .env.local) in project root if needed:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

4) Run dev server
```
npm run dev
```

5) Build
```
npm run build
```

6) Preview build
```
npm run preview
```

Project Structure

```
src/
  components/
    layout/                 # Role-based layouts (TeacherLayout, StudentLayout)
    ui/                     # Reusable UI (Button, Card, etc.)
  context/
    AuthContext.jsx         # Auth and user role info
  lib/
    axios.js                # Axios instance
    api.js                  # Frontend API helpers (classes, subjects, grades, exams, questions, fees, payments, etc.)
  pages/
    admin/                  # Admin pages (Classes, Teachers, Attendance, Analytics, Finance, etc.)
    teacher/                # Teacher pages (Dashboard, Classes, Students, Attendance, Grades, CBT)
      cbt/                  # ExamWizard, QuestionBank, ExamAnalytics, etc.
      grades/               # BulkGradeUpload, GradeAnalytics, GradeExport
      attendance/           # AttendanceReports, BulkAttendance
    student/                # Student pages (Dashboard, Classes, Subjects, Exams, Fees, Settings)
  services/
    notificationService.js  # Socket connection + listeners
  App.jsx                   # Router and routes
```

Key Workflows

Admin

- Classes: create/edit classes, assign subjects, teachers, students (Admin → ClassesPage)
- Teachers: manage teachers; searchable/paginated list; edit in form (Admin → TeachersPage)
- Attendance: advanced filters; mobile-friendly tables (Admin → AttendancePage)
- Analytics: KPIs, charts, tabs for academic/financial/attendance insights (Admin → AnalyticsPage)
- Finance: fee categories, invoices, transactions; responsive (Admin → FinancePage)
- Payment Management: summaries, charts, breakdowns, recent payments (Admin → PaymentManagementPage)

Teacher

- Dashboard: KPIs, attendance overview, performance charts, recent grades
- Classes/Students/Subjects: responsive lists with quick actions
- Attendance: mark, bulk mark, review reports
- Grades: upload, bulk upload, view, summarize, export; analytics
- CBT (Exams): create via ExamWizard, manage questions, publish/unpublish, results

Student

- Dashboard: modern design with KPIs, charts, upcoming exams
- Classes/Subjects/Exams: responsive lists with quick actions
- Exams: attempt, review, results
- Fees: fees table, Paystack flow; auto-refresh planned via socket listener
- Settings: profile/password/notifications/theme

API Helpers (frontend)

See src/lib/api.js for full list. Highlights:

- classesApi: get/create/update/delete
- subjectsApi: get/create/update/delete
- teachersApi: get/update/delete + get/me
- studentsApi: get/create/update/delete
- examsApi: list/create/update/status/addQuestions/get/delete/exportResults
- questionsApi: bank/create/update/delete
- gradesApi: list/create/bulk/update/delete
- paymentsApi + feesApi (v2): initiate/history/analytics; fees for student
- teacherResultsApi, adminAnalyticsApi, attendanceApi, assignmentsApi, filesApi, notificationsApi, termResultsApi

CBT/Exam Notes

- ExamWizard includes validation for required fields (title, classId, subjectId, teacherId, start/end, duration, term, examType, academicYear)
- Questions support MCQ, True/False, Short Answer
- Manage exams in Teacher → CBTPage (edit/delete exam, add/edit/delete questions)
- Publish/Unpublish exams via status toggle
- Results export supported via examsApi.exportResults (CSV/JSON)

Payments and Webhooks (Dev)

- Backend route (example in backend-context): POST /payments/simulate-webhook (admin only)
- Controller simulates Paystack charge.success, updates transactions and fee balance, emits socket event payment:success
- Frontend plan: add socket listener for payment:success in notificationService.js and trigger refetch in Student Fees/Dashboard

Assignments & Files

- Assignments: create/list/presign/submit, grade submissions
- Files: presigned upload, confirm, list, delete

Design & Responsiveness

- Mobile-first Tailwind utilities: flex/grid, sm/md/lg breakpoints, text truncation, card views replacing tables on small screens
- Charts are wrapped with ResponsiveContainer for flexible sizing
- Long, filterable lists are paginated or set up with infinite loading (e.g., class form selectors)

Admin UX Enhancements

- TeachersPage and ClassesPage forms use search + incremental loading (“Load more”) for Subjects/Teachers/Students to handle large datasets beyond single-page limits

Subject–Student Assignment Model

- Subjects are attached to classes; students receive subjects through class membership
- To give a student a subject, either add the subject to the class or move the student to a class that has that subject
- Electives per student can be added if required (extend StudentDetailPage and backend schema)

Environment & Config

- VITE_API_BASE_URL: Base API URL (default http://localhost:5000/api)

Scripts

- dev: run Vite dev server
- build: production build
- preview: preview production build

Authentication & Roles

- AuthContext manages user info and role (admin/teacher/student)
- Routes guarded by role-based layouts

Troubleshooting

- Seeing limited lists in selects: use the “Load more” button or type to filter; lists use infinite loading where applicable
- Dates not saving: ensure datetime-local is converted to ISO (handled in components)
- Payment not reflecting: use admin simulate-webhook endpoint; ensure backend emits payment:success; add/refine socket listener

Contributing

1. Create a feature branch
2. Write clear, readable code (see code style in project)
3. Ensure no linter errors
4. Open PR with description and screenshots (if UI)

License

Proprietary – for internal school management use.
