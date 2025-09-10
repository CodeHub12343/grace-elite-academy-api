import { useState, useCallback } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../lib/axios'

export function FileUpload({ 
  onUploadComplete, 
  onUploadError, 
  category = 'general',
  relatedId = null,
  isPublic = false,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSize = 10 * 1024 * 1024 // 10MB
}) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const getPresignedUrl = async (file) => {
    try {
      const response = await api.post('/api/files/upload-url', {
        fileName: file.name,
        mimeType: file.type,
        category,
        relatedId,
        isPublic
      })
      return response.data.uploadUrl
    } catch (error) {
      throw new Error('Failed to get upload URL')
    }
  }

  const uploadToS3 = async (file, presignedUrl) => {
    try {
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
    } catch (error) {
      throw new Error('Failed to upload to S3')
    }
  }

  const confirmUpload = async (fileKey) => {
    try {
      await api.patch(`/api/files/confirm/${fileKey}`)
    } catch (error) {
      throw new Error('Failed to confirm upload')
    }
  }

  const handleFileUpload = async (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
      error: null
    }))

    setFiles(prev => [...prev, ...newFiles])
    setUploading(true)

    for (const fileObj of newFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 10 } : f
        ))

        // Get presigned URL
        const presignedUrl = await getPresignedUrl(fileObj.file)
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 30 } : f
        ))

        // Upload to S3
        await uploadToS3(fileObj.file, presignedUrl)
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 80 } : f
        ))

        // Extract fileKey from presigned URL
        const fileKey = presignedUrl.split('?')[0].split('/').pop()
        
        // Confirm upload
        await confirmUpload(fileKey)
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
        ))

        onUploadComplete?.(fileKey, fileObj.file.name)

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
        ))
        onUploadError?.(error, fileObj.file.name)
      }
    }

    setUploading(false)
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [])

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files)
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return '🖼️'
    if (['pdf'].includes(ext)) return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx'].includes(ext)) return '📊'
    if (['ppt', 'pptx'].includes(ext)) return '📈'
    return '📁'
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here, or <span className="text-primary font-medium">click to browse</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Max {maxFiles} files, {maxSize / (1024 * 1024)}MB each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileObj) => (
            <div
              key={fileObj.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(fileObj.file.name)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {fileObj.status === 'pending' && (
                  <div className="text-gray-400">Pending...</div>
                )}
                
                {fileObj.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileObj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{fileObj.progress}%</span>
                  </div>
                )}
                
                {fileObj.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                
                {fileObj.status === 'error' && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-xs text-red-500">{fileObj.error}</span>
                  </div>
                )}
                
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

















