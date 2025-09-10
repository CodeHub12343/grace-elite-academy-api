import { useState } from 'react'
import { Plus, Upload, Folder, BarChart3 } from 'lucide-react'
import { FileUpload } from '../../components/ui/FileUpload'
import { FileBrowser } from '../../components/ui/FileBrowser'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'

export default function FilesPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleUploadComplete = (fileKey, fileName) => {
    setUploadedFiles(prev => [...prev, { key: fileKey, name: fileName }])
  }

  const handleUploadError = (error, fileName) => {
    console.error(`Upload failed for ${fileName}:`, error)
  }

  const handleFileDelete = (fileId) => {
    console.log('File deleted:', fileId)
  }

  const categories = [
    { id: 'all', name: 'All Files', icon: Folder },
    { id: 'assignments', name: 'Assignments', icon: Folder },
    { id: 'exams', name: 'Exams', icon: Folder },
    { id: 'profiles', name: 'Profiles', icon: Folder },
    { id: 'general', name: 'General', icon: Folder },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload, organize, and manage files across the system
          </p>
        </div>
        
        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Files</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2.4 GB</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Uploads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browse Files</h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <category.icon className="inline h-4 w-4 mr-2" />
              {category.name}
            </button>
          ))}
        </div>

        <FileBrowser
          category={selectedCategory === 'all' ? null : selectedCategory}
          onDelete={handleFileDelete}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Files"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Select Category
            </h4>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white">
              <option value="general">General</option>
              <option value="assignments">Assignments</option>
              <option value="exams">Exams</option>
              <option value="profiles">Profiles</option>
            </select>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Upload Files
            </h4>
            <FileUpload
              category="general"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={10}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowUploadModal(false)}
            >
              Upload Complete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

















