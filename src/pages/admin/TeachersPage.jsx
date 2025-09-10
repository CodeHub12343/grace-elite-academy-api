import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi, classesApi, subjectsApi } from '../../lib/api';
import { api } from '../../lib/axios';
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
  BookOpen,
  Users
} from 'lucide-react';

const TeachersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list, create, edit, view
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    subjectId: '',
    status: '',
    page: 1,
    limit: 10,
    sort: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch teachers with filters
  const { data: teachersData, isLoading, error } = useQuery({
    queryKey: ['teachers', filters],
    queryFn: () => teachersApi.getTeachers(filters),
    keepPreviousData: true
  });

  // Fetch classes and subjects for filters
  const { data: classesData } = useQuery({
    queryKey: ['classes','filters'],
    queryFn: () => classesApi.getClasses({ limit: 1000 })
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects','filters'],
    queryFn: () => subjectsApi.getSubjects({ limit: 1000 })
  });

  // Debug logging
  console.log('Teachers data:', teachersData);
  console.log('Classes data:', classesData);
  console.log('Subjects data:', subjectsData);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  // Mutations
  const createMutation = useMutation({
    mutationFn: teachersApi.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      toast.success('Teacher created successfully');
      setView('list');
    },
    onError: (error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teachersApi.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      toast.success('Teacher updated successfully');
      setView('list');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: teachersApi.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      toast.success('Teacher deleted successfully');
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

  const exportTeachers = () => {
    toast.success('Export functionality coming soon');
  };

  const importTeachers = () => {
    toast.success('Import functionality coming soon');
  };

  if (view === 'create') {
    return <TeacherForm mode="create" onBack={() => setView('list')} onSubmit={createMutation.mutate} />;
  }

  if (view === 'edit' && selectedTeacher) {
    return <TeacherForm mode="edit" teacher={selectedTeacher} onBack={() => setView('list')} onSubmit={(data) => updateMutation.mutate({ id: selectedTeacher._id, data })} />;
  }

  if (view === 'view' && selectedTeacher) {
    return <TeacherView teacher={selectedTeacher} onBack={() => setView('list')} />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-2">Manage all teachers in the system</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={importTeachers}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={exportTeachers}
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
            Add Teacher
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
            placeholder="Search teachers by name, email, or ID..."
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
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

      {/* Teachers Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading teachers...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Error loading teachers: {error.message}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" onClick={() => handleSort('email')}>
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachersData?.data?.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {teacher.userId?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{teacher.userId?.name}</div>
                            <div className="text-sm text-gray-500">ID: {teacher._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.userId?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.subjects?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {subject.name}
                              </span>
                            ))}
                            {teacher.subjects.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{teacher.subjects.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          'No subjects'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.classes?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacher.classes.slice(0, 2).map((cls, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {cls.name}
                              </span>
                            ))}
                            {teacher.classes.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{teacher.classes.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          'No classes'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                          teacher.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {teacher.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/a/teachers/${teacher._id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setView('edit');
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this teacher?')) {
                                deleteMutation.mutate(teacher._id);
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
                {teachersData?.data?.map((teacher) => (
                  <div key={teacher._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-semibold text-sm">
                            {teacher.userId?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{teacher.userId?.name}</div>
                          <div className="text-xs text-gray-500">ID: {teacher._id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/a/teachers/${teacher._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setView('edit');
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this teacher?')) {
                              deleteMutation.mutate(teacher._id);
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
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-900 truncate ml-2">{teacher.userId?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                          teacher.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {teacher.status || 'active'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subjects:</span>
                        <span className="text-gray-900">{teacher.subjects?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Classes:</span>
                        <span className="text-gray-900">{teacher.classes?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Joined:</span>
                        <span className="text-gray-900">{new Date(teacher.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {teachersData?.pagination && (
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
                    disabled={filters.page >= teachersData.pagination.pages}
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
                        {Math.min(filters.page * filters.limit, teachersData.pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{teachersData.pagination.total}</span>
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
                      
                      {Array.from({ length: Math.min(5, teachersData.pagination.pages) }, (_, i) => {
                        const page = Math.max(1, Math.min(teachersData.pagination.pages - 4, filters.page - 2)) + i;
                        if (page > teachersData.pagination.pages) return null;
                        
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
                        disabled={filters.page >= teachersData.pagination.pages}
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

// Teacher Form Component
const TeacherForm = ({ mode, teacher, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    userId: teacher?.userId?._id || '',
    name: teacher?.userId?.name || '',
    email: teacher?.userId?.email || '',
    subjects: teacher?.subjects?.map(s => s._id) || [],
    classes: teacher?.classes?.map(c => c._id) || [],
    phone: teacher?.phone || '',
    qualification: teacher?.qualification || '',
    experience: teacher?.experience || '',
    address: teacher?.address || '',
  });

  const [subjectsLimit, setSubjectsLimit] = useState(100);
  const [classesLimit, setClassesLimit] = useState(100);
  const [subjectsSearch, setSubjectsSearch] = useState('');
  const [classesSearch, setClassesSearch] = useState('');

  const { data: classesData, isFetching: classesFetching } = useQuery({
    queryKey: ['classes','form', { limit: classesLimit, search: classesSearch }],
    queryFn: () => classesApi.getClasses({ limit: classesLimit, search: classesSearch || undefined }),
    keepPreviousData: true,
  });

  const { data: subjectsData, isFetching: subjectsFetching } = useQuery({
    queryKey: ['subjects','form', { limit: subjectsLimit, search: subjectsSearch }],
    queryFn: () => subjectsApi.getSubjects({ limit: subjectsLimit, search: subjectsSearch || undefined }),
    keepPreviousData: true,
  });

  // Fetch users with role=teacher for user picker
  const { data: usersData } = useQuery({
    queryKey: ['users','teachers'],
    queryFn: async () => {
      try {
        const res = await api.get('/users', { params: { role: 'teacher', limit: 1000 } })
        return res.data
      } catch {
        return { data: [] }
      }
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      userId: formData.userId,
      subjects: formData.subjects,
      classes: formData.classes,
      phone: formData.phone || undefined,
      qualification: formData.qualification || undefined,
      experience: formData.experience !== '' ? Number(formData.experience) : undefined,
      address: formData.address || undefined,
    }
    onSubmit(payload);
  };

  const filteredSubjects = (subjectsData?.data || []).filter(s => s.name.toLowerCase().includes(subjectsSearch.toLowerCase()));
  const filteredClasses = (classesData?.data || []).filter(c => c.name.toLowerCase().includes(classesSearch.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Teachers
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {mode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User (Teacher) *</label>
            {usersData?.data && usersData.data.length > 0 ? (
              <select
                required
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Teacher User</option>
                {usersData.data.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Enter User ID (role=teacher)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {(!usersData?.data || usersData.data.length === 0) && (
              <p className="mt-1 text-xs text-gray-500">No teacher users found. Create a user first (role: teacher), then paste the userId.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
            <input
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
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
                onClick={() => setSubjectsLimit(prev => prev + 100)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={subjectsFetching}
              >
                {subjectsFetching ? 'Loading...' : 'Load more'}
              </button>
            </div>
          </div>
          <select
            multiple
            value={formData.subjects}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(o => o.value)
              setFormData(prev => ({ ...prev, subjects: values }))
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
            <label className="block text-sm font-medium text-gray-700">Classes</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={classesSearch}
                onChange={(e) => setClassesSearch(e.target.value)}
                placeholder="Search classes..."
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => setClassesLimit(prev => prev + 100)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={classesFetching}
              >
                {classesFetching ? 'Loading...' : 'Load more'}
              </button>
            </div>
          </div>
          <select
            multiple
            value={formData.classes}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(o => o.value)
              setFormData(prev => ({ ...prev, classes: values }))
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[10rem]"
          >
            {filteredClasses.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
            {mode === 'create' ? 'Create Teacher' : 'Update Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Teacher View Component
const TeacherView = ({ teacher, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Teachers
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Details</h1>
      </div>

      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-semibold text-xl sm:text-2xl">
              {teacher.userId?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{teacher.userId?.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base">Teacher ID: {teacher._id}</p>
            <p className="text-gray-600 text-sm sm:text-base truncate">{teacher.userId?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <span className="ml-2 text-gray-900">{teacher.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Qualification:</span>
                <span className="ml-2 text-gray-900">{teacher.qualification || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Specialization:</span>
                <span className="ml-2 text-gray-900">{teacher.specialization || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Address:</span>
                <span className="ml-2 text-gray-900">{teacher.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                  teacher.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {teacher.status || 'active'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Hire Date:</span>
                <span className="ml-2 text-gray-900">
                  {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Joined:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(teacher.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
          {teacher.subjects && teacher.subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  {subject.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subjects assigned</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Classes</h3>
          {teacher.classes && teacher.classes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map((cls, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {cls.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No classes assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;

