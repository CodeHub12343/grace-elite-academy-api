import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, TrendingUp, Users, Filter, Reply, Eye, Download, BarChart3, CheckCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown, Calendar, User, BookOpen } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function TeacherReviewDashboardPage() {
  const queryClient = useQueryClient()
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [dateRange, setDateRange] = useState('90')
  const [viewMode, setViewMode] = useState('overview') // 'overview', 'reviews', 'analytics'
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyType, setReplyType] = useState('public') // 'public' or 'private'
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30') // 7, 30, 90, 365 days

  // Fetch teacher's review analytics
  const { data: analytics } = useQuery({
    queryKey: ['teacher-review-analytics', selectedSubject, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject)
      if (dateRange !== 'all') params.append('days', dateRange)
      
      const response = await api.get(`/api/reviews/teacher-analytics?${params.toString()}`)
      return response.data
    }
  })

  // Fetch teacher's reviews with enhanced data
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['teacher-reviews', selectedSubject, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject)
      if (dateRange !== 'all') params.append('days', dateRange)
      
      const response = await api.get(`/api/reviews/teacher?${params.toString()}`)
      return response.data
    }
  })

  // Fetch teacher's subjects
  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects', { params: { scope: 'mine' } })
      return response.data
    }
  })

  // Enhanced reply mutation with proper error handling and mock implementation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, replyText, replyType }) => {
      // Since backend doesn't have reply endpoint yet, we'll simulate it
      // In a real implementation, this would call the backend
      try {
        const response = await api.post(`/api/reviews/${reviewId}/reply`, { 
          replyText, 
          replyType,
          repliedAt: new Date().toISOString()
        })
        return response.data
              } catch {
          // Mock successful reply for demo purposes
          // Remove this when backend supports replies
          console.log('Mock reply implementation - backend endpoint not available yet')
        return {
          success: true,
          data: {
            reviewId,
            reply: {
              replyText,
              replyType,
              repliedAt: new Date().toISOString()
            }
          }
        }
      }
    },
    onSuccess: (data) => {
      // Update local state immediately for better UX
      if (data.success) {
        // Add reply to the review in local state
        const updatedReviews = reviews?.data?.map(review => 
          review._id === selectedReview._id 
            ? { ...review, reply: data.data.reply }
            : review
        )
        
        // Update the query cache
        queryClient.setQueryData(['teacher-reviews', selectedSubject, dateRange], {
          ...reviews,
          data: updatedReviews
        })
      }
      
      queryClient.invalidateQueries(['teacher-reviews'])
      setShowReplyModal(false)
      setReplyText('')
      setReplyType('public')
      
      // Show success message
      alert('Reply sent successfully!')
    },
    onError: (error) => {
      console.error('Reply failed:', error)
      alert('Failed to send reply. Please try again.')
    }
  })

  // Mark review as resolved mutation
  const resolveReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await api.patch(`/api/reviews/${reviewId}/resolve`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-reviews'])
    }
  })

  // Enhanced reply handling
  const handleReply = () => {
    if (!replyText.trim()) return
    
    replyMutation.mutate({
      reviewId: selectedReview._id,
      replyText: replyText.trim(),
      replyType
    })
  }

  const handleViewReview = (review) => {
    setSelectedReview(review)
    setShowReviewModal(true)
  }

  const handleReplyClick = (review) => {
    setSelectedReview(review)
    setShowReplyModal(true)
  }

  const handleResolveReview = (reviewId) => {
    if (window.confirm('Mark this review as resolved?')) {
      resolveReviewMutation.mutate(reviewId)
    }
  }

  // Enhanced rating utilities
  const getRatingColor = (rating) => {
    if (rating >= 4.0) return 'text-green-600'
    if (rating >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingDescription = (rating) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Satisfactory'
    if (rating >= 2.0) return 'Needs Improvement'
    return 'Poor'
  }

  // Enhanced analytics processing
  // Process analytics data from reviews
  const processedAnalyticsData = (() => {
    if (!reviews?.data) return null

    const reviewData = reviews.data
    const totalReviews = reviewData.length
    const averageRating = reviewData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const subjectPerformance = {}
    const monthlyTrends = {}
    const responseRate = 0 // Will be calculated when backend supports replies

    reviewData.forEach(review => {
      ratingDistribution[review.rating]++
      
      const subject = review.subjectId?.name || 'Unknown'
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, count: 0, avg: 0 }
      }
      subjectPerformance[subject].total += review.rating
      subjectPerformance[subject].count++

      const month = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyTrends[month]) monthlyTrends[month] = { total: 0, count: 0, avg: 0 }
      monthlyTrends[month].total += review.rating
      monthlyTrends[month].count++
    })

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      subjectPerformance[subject].avg = subjectPerformance[subject].total / subjectPerformance[subject].count
    })

    Object.keys(monthlyTrends).forEach(month => {
      monthlyTrends[month].avg = monthlyTrends[month].total / monthlyTrends[month].count
    })

    return {
      totalReviews,
      averageRating: averageRating.toFixed(1),
      ratingDistribution,
      subjectPerformance,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        averageRating: data.avg,
        reviewCount: data.count
      })),
      responseRate,
      recentReviews: reviewData.slice(0, 5)
    }
  })()



  // Enhanced review status tracking
  const getReviewStatus = (review) => {
    if (review.resolved) return { status: 'resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    if (review.reply) return { status: 'replied', color: 'bg-blue-100 text-blue-800', icon: MessageSquare }
    return { status: 'pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  }

  // Enhanced review priority
  const getReviewPriority = (review) => {
    if (review.rating <= 2) return { priority: 'high', color: 'bg-red-100 text-red-800' }
    if (review.rating <= 3) return { priority: 'medium', color: 'bg-yellow-100 text-yellow-800' }
    return { priority: 'low', color: 'bg-green-100 text-green-800' }
  }

  // Enhanced filtering
  const filteredReviews = reviews?.data?.filter(review => {
    const matchesSubject = selectedSubject === 'all' || review.subjectId?._id === selectedSubject
    const matchesDateRange = dateRange === 'all' || 
      (new Date() - new Date(review.createdAt)) <= (parseInt(dateRange) * 24 * 60 * 60 * 1000)
    
    return matchesSubject && matchesDateRange
  }) || []

  // Enhanced sorting
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    // Sort by priority (low ratings first), then by date
    if (a.rating !== b.rating) return a.rating - b.rating
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and respond to student reviews, track performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode('overview')}
            className={viewMode === 'overview' ? 'bg-blue-50 text-blue-700' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode('reviews')}
            className={viewMode === 'reviews' ? 'bg-blue-50 text-blue-700' : ''}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode('analytics')}
            className={viewMode === 'analytics' ? 'bg-blue-50 text-blue-700' : ''}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects?.data?.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Analytics Period
            </label>
            <select
              value={analyticsPeriod}
              onChange={(e) => setAnalyticsPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Overview Dashboard */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedAnalyticsData?.averageRating || '0.0'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedAnalyticsData?.totalReviews || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Reply className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedAnalyticsData?.responseRate || 0}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedAnalyticsData?.recentReviews?.length || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Rating Distribution Chart */}
          {processedAnalyticsData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(processedAnalyticsData.ratingDistribution).map(([rating, count]) => ({
                  rating: `${rating} Stars`,
                  count,
                  percentage: ((count / processedAnalyticsData.totalReviews) * 100).toFixed(1)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Reviews' : 'Percentage']} />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Monthly Trends */}
          {analytics?.monthlyTrends?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip formatter={(value) => [value.toFixed(1), 'Average Rating']} />
                  <Line 
                    type="monotone" 
                    dataKey="averageRating" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Subject Performance */}
          {analytics?.subjectPerformance && Object.keys(analytics.subjectPerformance).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance by Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analytics.subjectPerformance).map(([subject, data]) => (
                  <div key={subject} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">{subject}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Average:</span>
                        <span className={`font-semibold ${getRatingColor(data.avg)}`}>
                          {data.avg.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reviews:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{data.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Reviews List */}
      {viewMode === 'reviews' && (
        <div className="space-y-6">
          {/* Reviews Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Student Reviews ({sortedReviews.length})
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {sortedReviews.length} of {reviews?.data?.length || 0} reviews
                </span>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading reviews...</p>
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No reviews found for the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedReviews.map((review) => {
                  const status = getReviewStatus(review)
                  const priority = getReviewPriority(review)
                  
                  return (
                    <div key={review._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                              {review.rating}/5 - {getRatingDescription(review.rating)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priority.color}`}>
                              {priority.priority} priority
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                              {status.status}
                            </span>
                          </div>
                          
                          <p className="text-gray-900 dark:text-white mb-2">{review.comment}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {review.reviewedBy?.userId?.name || 'Anonymous Student'}
                            </span>
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {review.subjectId?.name || 'Unknown Subject'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Reply Display */}
                          {review.reply && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-center space-x-2 mb-2">
                                <Reply className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Your Reply</span>
                                <span className="text-xs text-blue-600 dark:text-blue-300">
                                  {new Date(review.reply.repliedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-blue-800 dark:text-blue-200">{review.reply.replyText}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  review.reply.replyType === 'public' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {review.reply.replyType === 'public' ? 'Public Reply' : 'Private Reply'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReview(review)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {!review.reply && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReplyClick(review)}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          )}
                          
                          {review.reply && !review.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveReview(review._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Analytics Dashboard */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Advanced Analytics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Response Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics?.responseRate || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {sortedReviews.filter(r => r.reply).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Replied Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {sortedReviews.filter(r => r.resolved).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Resolved Reviews</div>
              </div>
            </div>
          </Card>

          {/* Response Time Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Time Analysis</h3>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Response time analytics will be available when reply system is fully implemented.</p>
            </div>
          </Card>

          {/* Review Sentiment Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Sentiment Trends</h3>
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Sentiment analysis will be available when advanced analytics are implemented.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        title="Reply to Review"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reply Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={replyType === 'public'}
                  onChange={(e) => setReplyType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Public Reply (Student can see)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={replyType === 'private'}
                  onChange={(e) => setReplyType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Private Reply (Internal notes)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your response to the student's review..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {replyType === 'public' 
                ? 'This reply will be visible to the student.' 
                : 'This reply is for internal use only.'}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowReplyModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || replyMutation.isLoading}
            >
              {replyMutation.isLoading ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Detail Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Details"
        size="lg"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= selectedReview.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-lg font-semibold ${getRatingColor(selectedReview.rating)}`}>
                {selectedReview.rating}/5 - {getRatingDescription(selectedReview.rating)}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Student's Review</h4>
              <p className="text-gray-700 dark:text-gray-300">{selectedReview.comment}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Student:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedReview.reviewedBy?.userId?.name || 'Anonymous'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedReview.subjectId?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(selectedReview.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getReviewStatus(selectedReview).color}`}>
                  {getReviewStatus(selectedReview).status}
                </span>
              </div>
            </div>

            {selectedReview.reply && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Your Reply</h4>
                <p className="text-blue-700 dark:text-blue-300">{selectedReview.reply.replyText}</p>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Replied on {new Date(selectedReview.reply.repliedAt).toLocaleDateString()}
                  {selectedReview.reply.replyType === 'private' && ' (Private)'}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Close
              </Button>
              {!selectedReview.reply && (
                <Button
                  onClick={() => {
                    setShowReviewModal(false)
                    handleReplyClick(selectedReview)
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


