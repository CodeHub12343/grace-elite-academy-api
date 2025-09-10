import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Send, CheckCircle, AlertCircle, BookOpen, Users, Target, MessageSquare } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'

export default function ReviewSubmissionPage() {
  const queryClient = useQueryClient()
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rating categories with weights
  const ratingCategories = [
    { id: 'teaching_quality', label: 'Teaching Quality', weight: 0.3 },
    { id: 'communication', label: 'Communication Skills', weight: 0.2 },
    { id: 'knowledge', label: 'Subject Knowledge', weight: 0.2 },
    { id: 'organization', label: 'Class Organization', weight: 0.15 },
    { id: 'fairness', label: 'Fairness & Consistency', weight: 0.15 }
  ]

  // Fetch teachers for dropdown
  const { data: teachers } = useQuery({
    queryKey: ['teachers', 'student'],
    queryFn: async () => {
      const response = await api.get('/teachers', { params: { scope: 'myTeachers' } })
      return response.data
    }
  })

  // Fetch subjects for selected teacher
  const { data: subjects } = useQuery({
    queryKey: ['subjects', 'teacher', selectedTeacher],
    queryFn: async () => {
      if (!selectedTeacher) return []
      const response = await api.get(`/teachers/${selectedTeacher}/subjects`)
      return response.data
    },
    enabled: !!selectedTeacher
  })

  // Check if student has already reviewed this teacher-subject combination
  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', selectedTeacher, selectedSubject],
    queryFn: async () => {
      if (!selectedTeacher || !selectedSubject) return null
      const response = await api.get(`/reviews/check?teacherId=${selectedTeacher}&subjectId=${selectedSubject}`)
      return response.data
    },
    enabled: !!selectedTeacher && !!selectedSubject
  })

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const response = await api.post('/reviews', reviewData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews'])
      setShowSuccessModal(true)
      setIsSubmitting(false)
      // Reset form
      setRating(0)
      setReviewText('')
      setAnonymous(false)
    },
    onError: (error) => {
      console.error('Failed to submit review:', error)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedSubject || rating === 0) {
      alert('Please select a teacher, subject, and provide a rating')
      return
    }

    if (reviewText.trim().length < 10) {
      alert('Please provide a review with at least 10 characters')
      return
    }

    setIsSubmitting(true)

    const reviewData = {
      teacherId: selectedTeacher,
      subjectId: selectedSubject,
      rating,
      reviewText: reviewText.trim(),
      anonymous,
      ratingBreakdown: ratingCategories.reduce((acc, category) => {
        acc[category.id] = rating
        return acc
      }, {})
    }

    await submitReviewMutation.mutateAsync(reviewData)
  }

  const handlePreview = () => {
    setShowPreviewModal(true)
  }

  const getRatingDescription = (rating) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Satisfactory'
    if (rating >= 2.0) return 'Needs Improvement'
    return 'Poor'
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.0) return 'text-green-600'
    if (rating >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const canSubmitReview = selectedTeacher && selectedSubject && rating > 0 && reviewText.trim().length >= 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Submit Teacher Review</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your feedback and help improve teaching quality
        </p>
      </div>

      {/* Review Form */}
      <Card className="max-w-4xl mx-auto p-8">
        <div className="space-y-6">
          {/* Teacher and Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Teacher *
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="">Choose a teacher</option>
                {teachers?.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} - {teacher.department}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={!selectedTeacher}
              >
                <option value="">Choose a subject</option>
                {subjects?.data?.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Existing Review Warning */}
          {existingReview && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You have already submitted a review for this teacher and subject. 
                  Submitting a new review will replace your previous one.
                </p>
              </div>
            </div>
          )}

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="ml-4">
                <span className={`text-lg font-semibold ${getRatingColor(rating)}`}>
                  {rating > 0 ? `${rating}/5` : 'No rating'}
                </span>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getRatingDescription(rating)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rating Breakdown
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratingCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {category.id === 'teaching_quality' && <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {category.id === 'communication' && <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {category.id === 'knowledge' && <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {category.id === 'organization' && <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {category.id === 'fairness' && <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {rating > 0 ? `${rating}/5` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              * Rating breakdown automatically follows your overall rating
            </p>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review *
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={6}
              placeholder="Share your experience with this teacher. What did you like? What could be improved? Be specific and constructive in your feedback..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minimum 10 characters required
              </p>
              <p className={`text-xs ${
                reviewText.length < 10 ? 'text-red-500' : 'text-green-500'
              }`}>
                {reviewText.length}/10
              </p>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="anonymous" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Submit anonymously
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex items-center space-x-2"
              disabled={!canSubmitReview}
            >
              <Eye className="h-4 w-4" />
              <span>Preview Review</span>
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!canSubmitReview || isSubmitting}
              className="flex items-center space-x-2 flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Review</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Review Submitted Successfully!"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Thank you for your feedback!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your review has been submitted and will help improve teaching quality.
            </p>
          </div>
          <Button
            onClick={() => setShowSuccessModal(false)}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Review Preview"
        size="2xl"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Review Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Teacher:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {teachers?.find(t => t._id === selectedTeacher)?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Subject:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {subjects?.find(s => s._id === selectedSubject)?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Rating:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {rating}/5 - {getRatingDescription(rating)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Anonymous:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {anonymous ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Review</h4>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {reviewText || 'No review text provided'}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPreviewModal(false)}
            >
              Edit Review
            </Button>
            <Button
              onClick={() => {
                setShowPreviewModal(false)
                handleSubmit()
              }}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



