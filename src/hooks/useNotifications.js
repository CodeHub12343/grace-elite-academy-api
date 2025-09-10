import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../lib/api'
import notificationService from '../services/notificationService'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.list({ userId: user?.id, limit: 100 }),
    enabled: !!user?.id
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      updateUnreadCount()
    }
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      updateUnreadCount()
    }
  })

  // Update unread count
  const updateUnreadCount = useCallback(() => {
    if (notificationsData?.data) {
      const count = notificationsData.data.filter(n => !n.readAt).length
      setUnreadCount(count)
    }
  }, [notificationsData])

  // Initialize notifications
  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data)
      updateUnreadCount()
    }
  }, [notificationsData, updateUnreadCount])

  // Connect to notification service
  useEffect(() => {
    if (user?.id && user?.token) {
      notificationService.connect(user.id, user.token)
      
      // Subscribe to real-time updates
      const unsubscribeNew = notificationService.subscribe('new', (notification) => {
        setNotifications(prev => [notification, ...prev])
        updateUnreadCount()
      })

      const unsubscribeUpdate = notificationService.subscribe('update', (updatedNotification) => {
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
        updateUnreadCount()
      })

      const unsubscribeDelete = notificationService.subscribe('delete', (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        updateUnreadCount()
      })

      // Connection status
      const checkConnection = () => {
        const status = notificationService.getConnectionStatus()
        setIsConnected(status === 'connected')
      }

      const interval = setInterval(checkConnection, 5000)
      checkConnection()

      return () => {
        unsubscribeNew()
        unsubscribeUpdate()
        unsubscribeDelete()
        clearInterval(interval)
        notificationService.disconnect()
      }
    }
  }, [user?.id, user?.token, updateUnreadCount])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    markReadMutation.mutate(notificationId)
  }, [markReadMutation])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    markAllReadMutation.mutate()
  }, [markAllReadMutation])

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    updateUnreadCount()
  }, [updateUnreadCount])

  // Filter notifications
  const filterNotifications = useCallback((filters) => {
    if (!notificationsData?.data) return []
    
    return notificationsData.data.filter(notification => {
      const matchesType = filters.type === 'all' || notification.type === filters.type
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'unread' && !notification.readAt) ||
                           (filters.status === 'read' && notification.readAt)
      const matchesSearch = !filters.search || 
                           notification.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                           notification.message?.toLowerCase().includes(filters.search.toLowerCase())
      
      return matchesType && matchesStatus && matchesSearch
    })
  }, [notificationsData])

  // Get notification statistics
  const getStats = useCallback(() => {
    if (!notificationsData?.data) return {}
    
    const total = notificationsData.data.length
    const unread = notificationsData.data.filter(n => !n.readAt).length
    const read = total - unread
    
    const byType = notificationsData.data.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {})
    
    const byStatus = notificationsData.data.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1
      return acc
    }, {})
    
    return {
      total,
      unread,
      read,
      byType,
      byStatus
    }
  }, [notificationsData])

  // Request desktop notification permission
  const requestPermission = useCallback(async () => {
    return await notificationService.requestPermission()
  }, [])

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return notificationService.getConnectionStatus()
  }, [])

  // Get reconnection attempts
  const getReconnectAttempts = useCallback(() => {
    return notificationService.getReconnectAttempts()
  }, [])

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterNotifications,
    refetch,
    
    // Utilities
    getStats,
    requestPermission,
    getConnectionStatus,
    getReconnectAttempts
  }
}













