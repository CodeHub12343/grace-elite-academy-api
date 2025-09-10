import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/TextInput'
import { Select } from '../../components/ui/Select'
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Save, 
  Eye, 
  EyeOff,
  Check,
  X
} from 'lucide-react'

export function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    experience: '',
    dateOfBirth: '',
    stateOfOrigin: '',
    localGovernment: '',
    houseAddress: '',
    sex: '',
    religion: '',
    accountNumber: '',
    bankName: '',
    accountName: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    gradeUpdates: true,
    attendanceAlerts: true,
    assignmentReminders: true,
    examNotifications: true
  })

  // Theme preferences state
  const [theme, setTheme] = useState('light')

  // Get teacher profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['teacher', 'profile'],
    queryFn: async () => {
      const response = await api.get('/auth/teacher/profile')
      return response.data
    },
    onSuccess: (data) => {
      const d = data.data || {}
      setProfileForm({
        name: d.user?.name || '',
        email: d.user?.email || '',
        phone: d.phone || '',
        qualification: d.qualification || '',
        experience: d.experience || '',
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().slice(0,10) : '',
        stateOfOrigin: d.stateOfOrigin || '',
        localGovernment: d.localGovernment || '',
        houseAddress: d.houseAddress || '',
        sex: d.sex || '',
        religion: d.religion || '',
        accountNumber: d.accountNumber || '',
        bankName: d.bankName || '',
        accountName: d.accountName || ''
      })
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/auth/teacher/profile', data),
    onSuccess: () => {
      window?.toast?.success?.('Profile updated successfully!')
    },
    onError: (error) => {
      window?.toast?.error?.(error.response?.data?.message || 'Failed to update profile')
    }
  })

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/teacher/change-password', data),
    onSuccess: () => {
      window?.toast?.success?.('Password updated successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error) => {
      window?.toast?.error?.(error.response?.data?.message || 'Failed to update password')
    }
  })

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: (data) => api.put('/teachers/notifications', data),
    onSuccess: () => {
      window?.toast?.success?.('Notification preferences updated!')
    },
    onError: (error) => {
      window?.toast?.error?.(error.response?.data?.message || 'Failed to update notifications')
    }
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    // Clean and map payload to backend shape
    const { name, email, ...rest } = profileForm
    const payload = { ...rest }
    // remove empty strings
    Object.keys(payload).forEach((k) => { if (payload[k] === '' || payload[k] === null) delete payload[k] })
    // date to ISO if present
    if (payload.dateOfBirth) {
      const d = new Date(payload.dateOfBirth)
      if (!isNaN(d.getTime())) payload.dateOfBirth = d.toISOString()
      else delete payload.dateOfBirth
    }
    updateProfileMutation.mutate(payload)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      window?.toast?.error?.('New passwords do not match')
      return
    }
    updatePasswordMutation.mutate({ oldPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
  }

  const handleNotificationsSubmit = (e) => {
    e.preventDefault()
    updateNotificationsMutation.mutate(notifications)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    // Apply theme change logic here
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your profile, security, and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-0 sm:space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'theme', label: 'Theme', icon: Palette }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.charAt(0)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Profile Information</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Update your personal information</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <TextInput
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <TextInput
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <TextInput
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qualification</label>
                  <TextInput
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., B.Ed, M.Ed"
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience (years)</label>
                  <TextInput
                    type="number"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 5"
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                  <TextInput
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sex</label>
                  <Select
                    value={profileForm.sex}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, sex: e.target.value }))}
                    className="w-full text-sm"
                    options={[{ value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Religion</label>
                  <TextInput
                    type="text"
                    value={profileForm.religion}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, religion: e.target.value }))}
                    placeholder="e.g., Christianity"
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State of Origin</label>
                  <TextInput
                    type="text"
                    value={profileForm.stateOfOrigin}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, stateOfOrigin: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Local Government</label>
                  <TextInput
                    type="text"
                    value={profileForm.localGovernment}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, localGovernment: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">House Address</label>
                  <textarea
                    value={profileForm.houseAddress}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, houseAddress: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
                  <TextInput
                    type="text"
                    value={profileForm.bankName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                  <TextInput
                    type="text"
                    value={profileForm.accountNumber}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Name</label>
                  <TextInput
                    type="text"
                    value={profileForm.accountName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, accountName: e.target.value }))}
                    className="w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Change Password</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <TextInput
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full text-sm pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <TextInput
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="w-full text-sm pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <TextInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="w-full text-sm pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4" />
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Notification Preferences</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Choose how you want to be notified</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNotificationsSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in browser' },
                  { key: 'gradeUpdates', label: 'Grade Updates', description: 'Get notified when grades are updated' },
                  { key: 'attendanceAlerts', label: 'Attendance Alerts', description: 'Receive attendance-related notifications' },
                  { key: 'assignmentReminders', label: 'Assignment Reminders', description: 'Get reminders about upcoming assignments' },
                  { key: 'examNotifications', label: 'Exam Notifications', description: 'Receive exam-related notifications' }
                ].map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{notification.label}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{notification.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifications(prev => ({ ...prev, [notification.key]: !prev[notification.key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications[notification.key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications[notification.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateNotificationsMutation.isPending}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Bell className="h-4 w-4" />
                  {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'theme' && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold">Theme Preferences</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { id: 'light', name: 'Light', description: 'Clean and bright interface' },
                  { id: 'dark', name: 'Dark', description: 'Easy on the eyes in low light' },
                  { id: 'system', name: 'System', description: 'Follow system preference' }
                ].map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeChange(themeOption.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      theme === themeOption.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{themeOption.name}</h4>
                      {theme === themeOption.id && <Check className="h-4 w-4 text-primary-600" />}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{themeOption.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




























