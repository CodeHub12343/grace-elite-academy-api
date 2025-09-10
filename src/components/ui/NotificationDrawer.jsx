import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Mail, MessageSquare, Check, Trash2, Settings, Filter, Search, Clock, Download } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationPreferences } from './NotificationPreferences'
import { NotificationHistory } from './NotificationHistory'

export function NotificationDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showPreferences, setShowPreferences] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterNotifications,
    requestPermission
  } = useNotifications()

  const filteredNotifications = filterNotifications({
    type: filterType,
    status: activeTab,
    search: searchTerm
  })

  const handleMarkRead = (id) => {
    markAsRead(id)
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleDeleteNotification = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotification(id)
    }
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

  const handlePreferencesSave = (preferences) => {
    console.log('Notification preferences saved:', preferences)
    // Here you would typically save preferences to the backend
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.aside 
            className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-600" />
                <h2 className="font-semibold text-lg">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
                {!isConnected && (
                  <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">
                    Offline
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Notification History"
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Notification Preferences"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative mb-3">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="in-app">In-App</option>
                </select>
                
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="text-xs px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark All Read
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {['all', 'unread', 'read'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications found</p>
                </div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id || index}
                    className={`rounded-lg border p-3 transition-all hover:shadow-md ${
                      notification.readAt 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                        : 'bg-white dark:bg-gray-900 border-primary-200 dark:border-primary-700'
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
                      
                      <div className="flex items-center gap-1">
                        {!notification.readAt && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => requestPermission()}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Enable Desktop
                  </button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      </AnimatePresence>

      {/* Notification Preferences Modal */}
      <NotificationPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handlePreferencesSave}
      />

      {/* Notification History Modal */}
      <NotificationHistory
        userId={notifications[0]?.userId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  )
}
