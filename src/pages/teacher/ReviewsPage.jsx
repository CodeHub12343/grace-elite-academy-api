import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Link } from 'react-router-dom'
import { Star, MessageSquare, BarChart3, TrendingUp, Users } from 'lucide-react'

export function TeacherReviewsPage() {
  const { data } = useQuery({ queryKey: ['reviews','mine'], queryFn: () => reviewsApi.mine() })

  // Navigation cards for Advanced Review Features
  const reviewFeatures = [
    {
      title: 'Review Dashboard',
      description: 'Monitor and respond to student feedback with comprehensive analytics',
      icon: MessageSquare,
      link: '/t/reviews/dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Review Analytics',
      description: 'Deep dive into performance metrics and improvement opportunities',
      icon: BarChart3,
      link: '/t/reviews/analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Performance Insights',
      description: 'Get actionable insights and recommendations for improvement',
      icon: TrendingUp,
      link: '/t/reviews/insights',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Reviews</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student feedback and track your performance
          </p>
        </div>
      </div>

      {/* Advanced Review Features Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviewFeatures.map((feature) => (
          <Link key={feature.title} to={feature.link}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${feature.color} text-white`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Basic Reviews Display */}
      <Card className="p-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
        </div>
        {(data?.data || []).length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No reviews yet.</p>
            <p className="text-sm">Students will be able to submit reviews for your classes.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(data?.data || []).map(r => (
              <div key={r._id} className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= r.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.rating}/5
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {r.comment || 'No comment provided'}
                </div>
                <div className="text-xs text-gray-400">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}