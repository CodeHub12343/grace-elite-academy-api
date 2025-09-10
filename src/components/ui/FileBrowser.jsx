import { useState, useEffect } from 'react'
import { Download, Trash2, Search, Filter, Eye, File, Folder, X } from 'lucide-react'
import { api } from '../../lib/axios'

export function FileBrowser({ 
  category = null, 
  relatedId = null, 
  onFileSelect = null,
  selectable = false,
  onDelete = null 
}) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedFiles, setSelectedFiles] = useState([])

  useEffect(() => {
    fetchFiles()
  }, [category, relatedId])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (relatedId) params.append('relatedId', relatedId)
      
      const response = await api.get(`/files?${params.toString()}`)
      setFiles(response.data.files || [])
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file) => {
    try {
      const response = await api.get(`/files/${file._id}/download`)
      const downloadUrl = response.data.downloadUrl
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`)
      setFiles(prev => prev.filter(f => f._id !== fileId))
      onDelete?.(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const handleFileSelect = (file) => {
    if (!selectable) return
    
    setSelectedFiles(prev => {
      const isSelected = prev.find(f => f._id === file._id)
      if (isSelected) {
        return prev.filter(f => f._id !== file._id)
      } else {
        return [...prev, file]
      }
    })
    
    onFileSelect?.(file)
  }

  const getFileIcon = (fileName, mimeType) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    if (mimeType?.startsWith('image/')) return '🖼️'
    if (ext === 'pdf') return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx'].includes(ext)) return '📊'
    if (['ppt', 'pptx'].includes(ext)) return '📈'
    if (['zip', 'rar', '7z'].includes(ext)) return '📦'
    return '📁'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || file.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(files.map(f => f.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white appearance-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200 ${
                selectable && selectedFiles.find(f => f._id === file._id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : ''
              }`}
            >
              {/* File Icon and Name */}
              <div 
                className={`flex items-center space-x-3 mb-3 ${selectable ? 'cursor-pointer' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <span className="text-3xl">{getFileIcon(file.originalName, file.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {/* File Details */}
              <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Category:</span> {file.category}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Uploaded:</span> {formatDate(file.createdAt)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-2 text-gray-600 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {selectable && (
                  <div className="text-xs text-gray-500">
                    {selectedFiles.find(f => f._id === file._id) ? 'Selected' : 'Click to select'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files Summary */}
      {selectable && selectedFiles.length > 0 && (
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary mb-2">
            {selectedFiles.length} file(s) selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map(file => (
              <span
                key={file._id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-white"
              >
                {file.originalName}
                <button
                  onClick={() => handleFileSelect(file)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}










