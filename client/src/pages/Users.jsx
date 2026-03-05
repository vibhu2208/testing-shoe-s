import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Plus, 
  Search, 
  Edit, 
  UserCheck, 
  UserX, 
  Key,
  Users as UsersIcon,
  Filter
} from 'lucide-react';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', currentPage, pageSize, roleFilter, statusFilter],
    queryFn: () => usersAPI.getUsers({
      page: currentPage,
      limit: pageSize,
      role: roleFilter || undefined,
      isActive: statusFilter || undefined
    }).then(res => res.data)
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => usersAPI.createUser(userData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowCreateModal(false);
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }) => usersAPI.updateUser(id, userData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowEditModal(false);
      setSelectedUser(null);
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }) => usersAPI.resetPassword(id, { newPassword }).then(res => res.data),
    onSuccess: () => {
      setShowPasswordModal(false);
      setSelectedUser(null);
    }
  });

  // Toggle user status mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'activate') {
        return usersAPI.activateUser(id).then(res => res.data);
      } else {
        return usersAPI.deactivateUser(id).then(res => res.data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    }
  });

  // Seed QA account mutation
  const seedQAMutation = useMutation({
    mutationFn: () => usersAPI.seedQA().then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      if (data.credentials) {
        alert(`QA Manager account created successfully!\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`);
      }
    },
    onError: (error) => {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  });

  // Filter users based on search term
  const filteredUsers = usersData?.users?.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateUser = (formData) => {
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = (formData) => {
    updateUserMutation.mutate({ id: selectedUser.id, ...formData });
  };

  const handleResetPassword = (formData) => {
    resetPasswordMutation.mutate({ id: selectedUser.id, newPassword: formData.newPassword });
  };

  const handleToggleUserStatus = (user, action) => {
    toggleUserStatusMutation.mutate({ id: user.id, action });
  };

  const handleSeedQA = () => {
    seedQAMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeedQA} variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Seed QA Account
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="qa_manager">QA Manager</option>
                <option value="tester">Tester</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Created</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'qa_manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'tester' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleUserStatus(user, user.isActive ? 'deactivate' : 'activate')}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersData?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, usersData.pagination.total)} of {usersData.pagination.total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, usersData.pagination.totalPages))}
                  disabled={currentPage === usersData.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          title="Create New User"
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserFormModal
          title="Edit User"
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          isLoading={updateUserMutation.isPending}
        />
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordResetModal
          user={selectedUser}
          onSubmit={handleResetPassword}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          isLoading={resetPasswordMutation.isPending}
        />
      )}
    </div>
  );
};

// User Form Modal Component
const UserFormModal = ({ title, user, onSubmit, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'tester',
    isActive: user?.isActive !== undefined ? user.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (user && !submitData.password) {
      delete submitData.password; // Don't update password if not provided
    }
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password {user && '(leave blank to keep current)'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="tester">Tester</option>
              <option value="qa_manager">QA Manager</option>
              <option value="admin">Admin</option>
              <option value="company">Company</option>
            </select>
          </div>
          {user && (
            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Password Reset Modal Component
const PasswordResetModal = ({ user, onSubmit, onClose, isLoading }) => {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ newPassword });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <p className="text-gray-600 mb-4">
          Reset password for {user.firstName} {user.lastName} ({user.email})
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;
