import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { classesApi, subjectsApi, teachersApi, studentsApi } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Users,
  BookOpen,
  Calendar
} from 'lucide-react';

const ClassesPage = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list, create, edit, view
  const [selectedClass, setSelectedClass] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    subjectId: '',
    teacherId: '',
    page: 1,
    limit: 10,
    sort: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch classes with filters
  const { data: classesData, isLoading, error } = useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesApi.getClasses(filters),
    keepPreviousData: true
  });

  // Fetch subjects and teachers for filters (larger limits for discoverability)
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects','filters'],
    queryFn: () => subjectsApi.getSubjects({ limit: 1000 })
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers','filters'],
    queryFn: () => teachersApi.getTeachers({ limit: 1000 })
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: classesApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      toast.success('Class created successfully');
      setView('list');
    },
    onError: (error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => classesApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      toast.success('Class updated successfully');
      setView('list');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: classesApi.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      toast.success('Class deleted successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (field) => {
    const currentSort = filters.sort;
    const newSort = currentSort.startsWith('-') && currentSort.slice(1) === field 
      ? field 
      : `-${field}`;
    setFilters(prev => ({ ...prev, sort: newSort, page: 1 }));
  };

  const exportClasses = () => {
    toast.success('Export functionality coming soon');
  };

  const importClasses = () => {
    toast.success('Import functionality coming soon');
  };

  if (view === 'create') {
    return <ClassForm mode="create" onBack={() => setView('list')} onSubmit={createMutation.mutate} />;
  }

  if (view === 'edit' && selectedClass) {
    return <ClassForm mode="edit" classData={selectedClass} onBack={() => setView('list')} onSubmit={(data) => updateMutation.mutate({ id: selectedClass._id, data })} />;
  }

  if (view === 'view' && selectedClass) {
    return <ClassView classData={selectedClass} onBack={() => setView('list')} />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-2">Manage all classes in the system</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={importClasses}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={exportClasses}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setView('create')}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Filters & Search</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search classes by name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={filters.subjectId}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Subjects</option>
              {subjectsData?.data?.map((subject) => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>

            <select
              value={filters.teacherId}
              onChange={(e) => handleFilterChange('teacherId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Teachers</option>
              {teachersData?.data?.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>{teacher.userId?.name}</option>
              ))}
            </select>

            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        )}
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Error loading classes: {error.message}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                      Class Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classesData?.data?.map((classItem) => (
                    <tr key={classItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classItem.section || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classItem.subjectIds?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {classItem.subjectIds.slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {subject?.name || subject?._id}
                              </span>
                            ))}
                            {classItem.subjectIds.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{classItem.subjectIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          'No subjects'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classItem.teacherIds?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {classItem.teacherIds.slice(0, 2).map((teacher, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {teacher?.userId?.name || teacher?.name || teacher?._id}
                              </span>
                            ))}
                            {classItem.teacherIds.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{classItem.teacherIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          'No teachers'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{classItem.studentIds?.length || 0} students</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text_gray-900">{new Date(classItem.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classItem.updatedAt ? new Date(classItem.updatedAt).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setView('view');
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setView('edit');
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this class?')) {
                                deleteMutation.mutate(classItem._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="space-y-4 p-4">
                {classesData?.data?.map((classItem) => (
                  <div key={classItem._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{classItem.name}</div>
                          <div className="text-xs text-gray-500">Section: {classItem.section || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedClass(classItem);
                            setView('view');
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                          setSelectedClass(classItem);
                            setView('edit');
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this class?')) {
                              deleteMutation.mutate(classItem._id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subjects:</span>
                        <span className="text-gray-900">{classItem.subjectIds?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teachers:</span>
                        <span className="text-gray-900">{classItem.teacherIds?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Students:</span>
                        <span className="text-gray-900">{classItem.studentIds?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-900">{new Date(classItem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {classesData?.pagination && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= classesData.pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(filters.page * filters.limit, classesData.pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{classesData.pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, classesData.pagination.pages) }, (_, i) => {
                        const page = Math.max(1, Math.min(classesData.pagination.pages - 4, filters.page - 2)) + i;
                        if (page > classesData.pagination.pages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === filters.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= classesData.pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Class Form Component
const ClassForm = ({ mode, classData, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    section: classData?.section || '',
    subjectIds: classData?.subjectIds?.map(s => s._id || s) || [],
    teacherIds: classData?.teacherIds?.map(t => t._id || t) || [],
    studentIds: classData?.studentIds?.map(s => s._id || s) || [],
  });

  const [subjectsSearch, setSubjectsSearch] = useState('');
  const [teachersSearch, setTeachersSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');

  // Infinite subjects loader
  const {
    data: subjectsPages,
    fetchNextPage: fetchMoreSubjects,
    hasNextPage: subjectsHasNext,
    isFetchingNextPage: subjectsLoadingMore,
  } = useInfiniteQuery({
    queryKey: ['subjects','form', { search: subjectsSearch }],
    queryFn: ({ pageParam = 1 }) => subjectsApi.getSubjects({ page: pageParam, limit: 200, search: subjectsSearch || undefined }),
    getNextPageParam: (lastPage, allPages) => {
      const p = lastPage?.pagination || lastPage?.meta
      if (!p) return undefined
      const current = p.page || p.currentPage || allPages.length
      const totalPages = p.pages || p.totalPages
      return current < totalPages ? (current + 1) : undefined
    },
    keepPreviousData: true,
  });

  // Infinite teachers loader
  const {
    data: teachersPages,
    fetchNextPage: fetchMoreTeachers,
    hasNextPage: teachersHasNext,
    isFetchingNextPage: teachersLoadingMore,
  } = useInfiniteQuery({
    queryKey: ['teachers','form', { search: teachersSearch }],
    queryFn: ({ pageParam = 1 }) => teachersApi.getTeachers({ page: pageParam, limit: 200, search: teachersSearch || undefined }),
    getNextPageParam: (lastPage, allPages) => {
      const p = lastPage?.pagination || lastPage?.meta
      if (!p) return undefined
      const current = p.page || p.currentPage || allPages.length
      const totalPages = p.pages || p.totalPages
      return current < totalPages ? (current + 1) : undefined
    },
    keepPreviousData: true,
  });

  // Infinite students loader
  const {
    data: studentsPages,
    fetchNextPage: fetchMoreStudents,
    hasNextPage: studentsHasNext,
    isFetchingNextPage: studentsLoadingMore,
  } = useInfiniteQuery({
    queryKey: ['students','form', { search: studentsSearch }],
    queryFn: ({ pageParam = 1 }) => studentsApi.getStudents({ page: pageParam, limit: 200, search: studentsSearch || undefined }),
    getNextPageParam: (lastPage, allPages) => {
      const p = lastPage?.pagination || lastPage?.meta
      if (!p) return undefined
      const current = p.page || p.currentPage || allPages.length
      const totalPages = p.pages || p.totalPages
      return current < totalPages ? (current + 1) : undefined
    },
    keepPreviousData: true,
  });

  const allSubjects = (subjectsPages?.pages || []).flatMap(p => p?.data || [])
  const allTeachers = (teachersPages?.pages || []).flatMap(p => p?.data || [])
  const allStudents = (studentsPages?.pages || []).flatMap(p => p?.data || [])

  const filteredSubjects = allSubjects.filter(s => s.name.toLowerCase().includes(subjectsSearch.toLowerCase()));
  const filteredTeachers = allTeachers.filter(t => (t.userId?.name || t.name || '').toLowerCase().includes(teachersSearch.toLowerCase()));
  const filteredStudents = allStudents.filter(st => (st.userId?.name || '').toLowerCase().includes(studentsSearch.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      section: formData.section || undefined,
      subjectIds: formData.subjectIds,
      teacherIds: formData.teacherIds,
      studentIds: formData.studentIds,
    };
    onSubmit(payload);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {mode === 'create' ? 'Add New Class' : 'Edit Class'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font_medium text-gray-700 mb-2">Section</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Subjects</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subjectsSearch}
                onChange={(e) => setSubjectsSearch(e.target.value)}
                placeholder="Search subjects..."
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => fetchMoreSubjects()}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                disabled={subjectsLoadingMore || !subjectsHasNext}
              >
                {subjectsLoadingMore ? 'Loading...' : (subjectsHasNext ? 'Load more' : 'All loaded')}
              </button>
            </div>
          </div>
          <select
            multiple
            value={formData.subjectIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(o => o.value)
              setFormData(prev => ({ ...prev, subjectIds: values }))
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[10rem]"
          >
            {filteredSubjects.map(subject => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Teachers</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={teachersSearch}
                onChange={(e) => setTeachersSearch(e.target.value)}
                placeholder="Search teachers..."
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => fetchMoreTeachers()}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                disabled={teachersLoadingMore || !teachersHasNext}
              >
                {teachersLoadingMore ? 'Loading...' : (teachersHasNext ? 'Load more' : 'All loaded')}
              </button>
            </div>
          </div>
          <select
            multiple
            value={formData.teacherIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(o => o.value)
              setFormData(prev => ({ ...prev, teacherIds: values }))
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[10rem]"
          >
            {filteredTeachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>{teacher.userId?.name || teacher._id}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Students</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={studentsSearch}
                onChange={(e) => setStudentsSearch(e.target.value)}
                placeholder="Search students..."
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => fetchMoreStudents()}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                disabled={studentsLoadingMore || !studentsHasNext}
              >
                {studentsLoadingMore ? 'Loading...' : (studentsHasNext ? 'Load more' : 'All loaded')}
              </button>
            </div>
          </div>
          <select
            multiple
            value={formData.studentIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(o => o.value)
              setFormData(prev => ({ ...prev, studentIds: values }))
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent min-h-[10rem]"
          >
            {filteredStudents.map(stu => (
              <option key={stu._id} value={stu._id}>{stu.userId?.name || stu._id}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
          >
            {mode === 'create' ? 'Create Class' : 'Update Class'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Class View Component
const ClassView = ({ classData, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Classes
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Class Details</h1>
      </div>

      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{classData.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base">Section: {classData.section || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Teachers:</span>
                <span className="ml-2 text-gray-900">{classData.teacherIds?.length || 0}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Students:</span>
                <span className="ml-2 text-gray-900">{classData.studentIds?.length || 0}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Subjects:</span>
                <span className="ml-2 text-gray-900">{classData.subjectIds?.length || 0}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{new Date(classData.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Updated:</span>
                <span className="ml-2 text-gray-900">{classData.updatedAt ? new Date(classData.updatedAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
          {classData.subjectIds && classData.subjectIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {classData.subjectIds.map((subject, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {subject?.name || subject?._id}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subjects assigned</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teachers</h3>
          {classData.teacherIds && classData.teacherIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {classData.teacherIds.map((teacher, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  {teacher?.userId?.name || teacher?.name || teacher?._id}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No teachers assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;

