import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Send, Mail, MessageSquare, Plus, Eye, Search, Filter, Users, BookOpen, CheckSquare } from 'lucide-react'
import { notificationsApi } from '../../lib/api'

export default function TeacherNotificationsPage() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [filters, setFilters] = useState({ type: 'all', status: 'all' })
  const [searchTerm, setSearchTerm] = useState('')
  
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'teacher'],
    queryFn: () => notificationsApi.list({ limit: 1000 })
  })

  const sendNotificationMutation = useMutation({
    mutationFn: notificationsApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      setShowSendModal(false)
    }
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
    }
  })

  const filteredNotifications = notifications?.data?.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filters.type === 'all' || notification.type === filters.type
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'unread' && !notification.readAt) ||
                         (filters.status === 'read' && notification.readAt)
    
    return matchesSearch && matchesType && matchesStatus
  }) || []

  const unreadCount = notifications?.data?.filter(n => !n.readAt).length || 0

  const handleSendNotification = (formData) => {
    sendNotificationMutation.mutate(formData)
  }

  const handleMarkRead = (id) => {
    markReadMutation.mutate(id)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'in-app': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'sms': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'in-app': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your notifications and send messages to students</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Send Message
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {notifications?.data?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sent Today</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {notifications?.data?.filter(n => 
                  new Date(n.createdAt).toDateString() === new Date().toDateString()
                ).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {/* This would come from a separate query */}
                24
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {['inbox', 'sent', 'templates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'inbox' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  >
                    <option value="all">All Types</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="in-app">In-App</option>
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id || index}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        notification.readAt ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${
                              notification.readAt ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {notification.title || 'Notification'}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(notification.createdAt || notification.timestamp)}
                            </span>
                          </div>
                          
                          <p className={`text-sm mt-1 ${
                            notification.readAt ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.message || 'No message content'}
                          </p>
                          
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                              {Object.entries(notification.metadata).map(([key, value]) => (
                                <span key={key} className="inline-block mr-2">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.readAt && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Mark as read"
                            >
                              <CheckSquare className="h-3 w-3 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedNotification(notification)
                              setShowViewModal(true)
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="View details"
                          >
                            <Eye className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium mb-4">Sent Notifications</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View notifications you've sent to students and track their delivery status.
              </p>
              {/* This would show sent notifications */}
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium mb-4">Message Templates</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Quick message templates for common student communications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Assignment Reminder', message: 'Your assignment is due tomorrow. Please submit on time.', category: 'Academic' },
                  { title: 'Attendance Notice', message: 'You were absent today. Please bring a note from your parent.', category: 'Attendance' },
                  { title: 'Grade Update', message: 'Your grades have been updated. Check your portal for details.', category: 'Academic' },
                  { title: 'Parent Meeting', message: 'Parent-teacher meeting scheduled for next week.', category: 'General' },
                  { title: 'Exam Reminder', message: 'Exam tomorrow. Don\'t forget to bring your materials.', category: 'Academic' },
                  { title: 'Behavior Notice', message: 'Please maintain proper behavior in class.', category: 'Behavior' }
                ].map((template, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.title}</h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.message}</p>
                    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Message Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowSendModal(false)} />
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Send Message to Students
                  </h3>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target)
                    handleSendNotification({
                      type: formData.get('type'),
                      title: formData.get('title'),
                      message: formData.get('message'),
                      targetClass: formData.get('targetClass')
                    })
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Message Type
                        </label>
                        <select name="type" required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2">
                          <option value="in-app">In-App Message</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Target Class
                        </label>
                        <select name="targetClass" required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2">
                          <option value="">Select a class</option>
                          <option value="class1">Class 10A</option>
                          <option value="class2">Class 10B</option>
                          <option value="class3">Class 11A</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subject
                        </label>
                        <input
                          name="title"
                          type="text"
                          required
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                          placeholder="Message subject"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Message
                        </label>
                        <textarea
                          name="message"
                          rows={4}
                          required
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                          placeholder="Enter your message..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSendModal(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sendNotificationMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {sendNotificationMutation.isPending ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Notification Modal */}
      <AnimatePresence>
        {showViewModal && selectedNotification && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowViewModal(false)} />
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Notification Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(selectedNotification.type)}
                        <span className="text-gray-900 dark:text-gray-100 capitalize">
                          {selectedNotification.type}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedNotification.title || 'No title'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedNotification.message || 'No message'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Received
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatTime(selectedNotification.createdAt || selectedNotification.timestamp)}
                      </p>
                    </div>
                    
                    {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Additional Info
                        </label>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>{' '}
                              <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
