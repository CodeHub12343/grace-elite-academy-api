import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Mail, MessageSquare, Smartphone, Settings, Save, X } from 'lucide-react'

export function NotificationPreferences({ isOpen, onClose, onSave }) {
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      types: {
        assignments: true,
        grades: true,
        attendance: true,
        announcements: true,
        payments: true
      }
    },
    sms: {
      enabled: false,
      types: {
        urgent: true,
        reminders: false,
        confirmations: false
      }
    },
    inApp: {
      enabled: true,
      types: {
        all: true,
        assignments: true,
        grades: true,
        attendance: true,
        announcements: true,
        payments: true
      }
    },
    frequency: 'immediate', // immediate, daily, weekly
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })

  const [activeTab, setActiveTab] = useState('email')

  const handleToggle = (category, type, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        types: {
          ...prev[category].types,
          [type]: value
        }
      }
    }))
  }

  const handleSave = () => {
    onSave?.(preferences)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
          
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <Settings className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Notification Preferences
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-8">
                  {[
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'sms', label: 'SMS', icon: MessageSquare },
                    { id: 'inApp', label: 'In-App', icon: Bell },
                    { id: 'general', label: 'General', icon: Settings }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content based on active tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email.enabled}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, enabled: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    {preferences.email.enabled && (
                      <div className="space-y-3">
                        {Object.entries(preferences.email.types).map(([type, enabled]) => (
                          <label key={type} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => handleToggle('email', type, e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'sms' && (
                  <motion.div
                    key="sms"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">SMS Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive urgent notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.sms.enabled}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            sms: { ...prev.sms, enabled: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    {preferences.sms.enabled && (
                      <div className="space-y-3">
                        {Object.entries(preferences.sms.types).map(([type, enabled]) => (
                          <label key={type} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => handleToggle('sms', type, e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'inApp' && (
                  <motion.div
                    key="inApp"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">In-App Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications within the application</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.inApp.enabled}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            inApp: { ...prev.inApp, enabled: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    {preferences.inApp.enabled && (
                      <div className="space-y-3">
                        {Object.entries(preferences.inApp.types).map(([type, enabled]) => (
                          <label key={type} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => handleToggle('inApp', type, e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {type === 'all' ? 'All Notifications' : type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Notification Frequency</h4>
                      <div className="space-y-2">
                        {['immediate', 'daily', 'weekly'].map((freq) => (
                          <label key={freq} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="frequency"
                              value={freq}
                              checked={preferences.frequency === freq}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                frequency: e.target.value
                              }))}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {freq === 'immediate' ? 'Immediate' : freq === 'daily' ? 'Daily Digest' : 'Weekly Summary'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Quiet Hours</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.quietHours.enabled}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      
                      {preferences.quietHours.enabled && (
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={preferences.quietHours.start}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                quietHours: { ...prev.quietHours, start: e.target.value }
                              }))}
                              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                            <input
                              type="time"
                              value={preferences.quietHours.end}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                quietHours: { ...prev.quietHours, end: e.target.value }
                              }))}
                              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={handleSave}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </button>
              <button
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}













