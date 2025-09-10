import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config'

class NotificationService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  connect(userId, token) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
        userId
      },
      query: {
        userId,
        role: 'user' // This would come from user context
      }
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to notification service')
      this.reconnectAttempts = 0
      this.emit('user:online', { timestamp: new Date().toISOString() })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification service:', reason)
      this.handleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.handleReconnect()
    })

    // Notification events
    this.socket.on('notification:new', (notification) => {
      this.notifyListeners('new', notification)
      this.showDesktopNotification(notification)
    })

    this.socket.on('notification:update', (notification) => {
      this.notifyListeners('update', notification)
    })

    this.socket.on('notification:delete', (notificationId) => {
      this.notifyListeners('delete', notificationId)
    })

    // System events
    this.socket.on('system:maintenance', (data) => {
      this.notifyListeners('maintenance', data)
    })

    this.socket.on('system:update', (data) => {
      this.notifyListeners('update', data)
    })
  }

  // Generic socket event subscription
  on(event, callback) {
    if (!this.socket) return () => {}
    this.socket.on(event, callback)
    return () => {
      try { this.socket.off(event, callback) } catch (_) {}
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.socket.connect()
      }
    }, delay)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  // Subscribe to notification events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in notification listener:', error)
        }
      })
    }
  }

  // Show desktop notification
  showDesktopNotification(notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const title = notification.title || 'New Notification'
    const options = {
      body: notification.message || 'You have a new notification',
      icon: '/favicon.ico', // Default icon
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      data: notification
    }

    // Add actions if supported
    if ('actions' in Notification.prototype) {
      options.actions = [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }

    const desktopNotification = new Notification(title, options)

    desktopNotification.onclick = () => {
      window.focus()
      desktopNotification.close()
      // Handle notification click - could navigate to specific page
      this.handleNotificationClick(notification)
    }

    desktopNotification.onaction = (event) => {
      if (event.action === 'view') {
        this.handleNotificationClick(notification)
      }
      desktopNotification.close()
    }

    // Auto close after 10 seconds unless it's high priority
    if (notification.priority !== 'high') {
      setTimeout(() => {
        desktopNotification.close()
      }, 10000)
    }
  }

  // Handle notification click
  handleNotificationClick(notification) {
    // This could navigate to specific pages based on notification type
    switch (notification.type) {
      case 'assignment':
        // Navigate to assignments page
        break
      case 'grade':
        // Navigate to grades page
        break
      case 'attendance':
        // Navigate to attendance page
        break
      case 'payment':
        // Navigate to payments page
        break
      default:
        // Navigate to notifications page
        break
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Send notification acknowledgment
  acknowledgeNotification(notificationId) {
    this.emit('notification:acknowledge', { notificationId })
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.emit('notification:read', { notificationId })
  }

  // Get connection status
  getConnectionStatus() {
    if (!this.socket) return 'disconnected'
    return this.socket.connected ? 'connected' : 'connecting'
  }

  // Get reconnection attempts
  getReconnectAttempts() {
    return this.reconnectAttempts
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService













