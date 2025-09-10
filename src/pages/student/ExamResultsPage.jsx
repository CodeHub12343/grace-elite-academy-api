import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cbtApi, studentsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  Download,
  Share2,
  Eye,
  BarChart3,
  TrendingUp,
  Target,
  Star,
  Calendar,
  Clock3
} from 'lucide-react';

const ExamResultsPage = () => {
  const { id } = useParams();
  const examId = id;
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const { user } = useAuth();
  const { data: meData } = useQuery({
    queryKey: ['students','me'],
    queryFn: () => studentsApi.getStudents({ scope: 'mine' })
  })
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['cbt','myResult', examId], 
    queryFn: () => cbtApi.myResult(examId),
    enabled: !!examId
  })
  
  const result = data?.data || data || {}
  const percentage = (result.percentage != null) ? result.percentage : (typeof result.score === 'number' && result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : undefined)
  function deriveGrade(p) {
    if (p == null) return undefined
    if (p >= 90) return 'A'
    if (p >= 80) return 'B'
    if (p >= 70) return 'C'
    if (p >= 60) return 'D'
    return 'F'
  }
  const myStudentId = Array.isArray(meData?.data)
    ? meData?.data?.[0]?._id
    : Array.isArray(meData)
      ? meData?.[0]?._id
      : meData?._id
  const examResult = {
    examId,
    examName: result.title || result.examName || 'Exam',
    totalQuestions: result.totalQuestions || (Array.isArray(result.questions) ? result.questions.length : undefined),
    correctAnswers: result.correctAnswers || result.correct || 0,
    incorrectAnswers: result.incorrectAnswers || result.incorrect || 0,
    score: (percentage != null) ? Math.round(percentage) : (result.score != null ? result.score : 0),
    grade: result.grade || deriveGrade(percentage),
    timeTaken: result.timeTaken || '-',
    submittedAt: result.submittedAt || result.completedAt || Date.now(),
    questions: result.questions || [],
    status: result.status || 'completed',
    maxScore: result.maxScore || 100,
    studentName: result.studentName || user?.name || 'Student',
    studentId: result.studentId || myStudentId || 'N/A'
  }

  const handleBack = () => {
    navigate('/s/exams');
  };

  const downloadResults = () => {
    // Implementation for downloading results as PDF
    console.log('Downloading results...');
    // TODO: Implement PDF generation and download
  };

  const shareResults = () => {
    // Implementation for sharing results
    console.log('Sharing results...');
    // TODO: Implement sharing functionality
  };

  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'B':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'C':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'D':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'F':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', icon: Award };
    if (score >= 80) return { level: 'Very Good', color: 'text-blue-600', icon: Star };
    if (score >= 70) return { level: 'Good', color: 'text-yellow-600', icon: TrendingUp };
    if (score >= 60) return { level: 'Satisfactory', color: 'text-orange-600', icon: Target };
    return { level: 'Needs Improvement', color: 'text-red-600', icon: XCircle };
  };

  const performanceLevel = getPerformanceLevel(examResult.score);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading exam results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Results</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load exam results. Please try again.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Exam Results</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">View your performance and review answers</p>
            </div>
          </div>
        </div>

        {/* Results Summary Card */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Score */}
            <div className="text-center">
              <div className={`text-2xl sm:text-4xl font-bold ${getScoreColor(examResult.score)} mb-1 sm:mb-2`}>
                {typeof examResult.score === 'number' ? `${examResult.score}%` : '-'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>

            {/* Grade */}
            <div className="text-center">
              <div className={`text-2xl sm:text-4xl font-bold ${getGradeColor(examResult.grade).split(' ')[0]} mb-1 sm:mb-2`}>
                {examResult.grade || 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Grade</div>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                {examResult.correctAnswers}/{examResult.totalQuestions || 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Correct</div>
            </div>

            {/* Time Taken */}
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                {examResult.timeTaken || 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
            </div>

            {/* Performance Level */}
            <div className="text-center">
              <div className={`text-lg sm:text-2xl font-bold ${performanceLevel.color} mb-1 sm:mb-2`}>
                {performanceLevel.level}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Performance</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={downloadResults}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download Results
            </Button>
            <Button
              onClick={shareResults}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4" />
              Share Results
            </Button>
          </div>
        </Card>

        {/* Performance Analytics */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {examResult.totalQuestions ? Math.round((examResult.correctAnswers / examResult.totalQuestions) * 100) : 0}%
              </div>
              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Accuracy Rate</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {examResult.incorrectAnswers}
              </div>
              <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Areas to Improve</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {examResult.grade || 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Overall Grade</div>
            </div>
          </div>
        </Card>

        {/* Exam Details */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Exam Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Exam Name:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{examResult.examName}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Student:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{examResult.studentName}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Student ID:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{examResult.studentId}</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Submitted:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {new Date(examResult.submittedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Question Review */}
        {examResult.questions && examResult.questions.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Question Review</h2>
            <div className="space-y-3 sm:space-y-4">
              {examResult.questions.map((question, index) => {
                const qid = question.id || question._id || index;
                return (
                <div
                  key={qid}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    question.isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Question {index + 1}</span>
                      {question.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedQuestion(selectedQuestion === qid ? null : qid)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{selectedQuestion === qid ? 'Hide' : 'View'}</span>
                    </Button>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">{question.question || question.questionText}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Your Answer:</span>
                      <p className={`text-sm ${
                        question.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {question.studentAnswer || question.yourAnswer || 'N/A'}
                      </p>
                    </div>
                    {!question.isCorrect && (
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Correct Answer:</span>
                        <p className="text-sm text-green-700 dark:text-green-400">{question.correctAnswer || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {selectedQuestion === qid && question.explanation && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Explanation:</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </Card>
        )}

        {/* Navigation Footer */}
        <div className="mt-6 sm:mt-8 text-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={handleBack} variant="outline" className="mr-0 sm:mr-4 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          <Button onClick={() => navigate('/s/dashboard')} className="w-full sm:w-auto mt-2 sm:mt-0">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultsPage;


