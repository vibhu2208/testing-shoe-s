import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import useAuthStore from '../store/authStore';
import { executionsAPI, assignmentsAPI } from '../lib/api';
import { 
  User, 
  Mail, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  Camera,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  RefreshCw,
  ClipboardList
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    totalAssignments: 0
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    department: ''
  });

  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setStatsLoading(true);
      
      // Fetch user's executions and assignments
      const [executionsResponse, assignmentsResponse] = await Promise.all([
        executionsAPI.getExecutions({ testerId: user.id }),
        assignmentsAPI.getAssignments({ assignedTesterId: user.id })
      ]);
      
      const executions = executionsResponse.data.executions || [];
      const assignments = assignmentsResponse.data.assignments || [];
      
      // Calculate statistics
      const totalTests = executions.length;
      const completedTests = executions.filter(exec => 
        exec.status === 'approved' || exec.status === 'submitted'
      ).length;
      const pendingTests = executions.filter(exec => 
        exec.status === 'in_progress'
      ).length;
      
      setUserStats({
        totalTests,
        completedTests,
        pendingTests,
        totalAssignments: assignments.length
      });
      
    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
      // Set default values on error
      setUserStats({
        totalTests: 0,
        completedTests: 0,
        pendingTests: 0,
        totalAssignments: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || ''
      });
      fetchUserStats();
    }
  }, [user, fetchUserStats]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      // In a real app, this would make an API call
      // For now, we'll just update the local state
      updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh statistics after profile update
      await fetchUserStats();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || ''
      });
    }
    setIsEditing(false);
    setSuccessMessage('');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'qa_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tester':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'company':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'qa_manager':
        return <CheckCircle className="h-4 w-4" />;
      case 'tester':
        return <Activity className="h-4 w-4" />;
      case 'company':
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Your basic personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50">
                      <Camera className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center space-x-1 ${getRoleBadgeColor(user?.role)}`}>
                      {getRoleIcon(user?.role)}
                      <span>{user?.role?.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Activity Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Your recent activity and account statistics
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserStats}
                  disabled={statsLoading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50/50 rounded-xl p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Tests</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{userStats.totalTests}</p>
                      )}
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50/50 rounded-xl p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{userStats.completedTests}</p>
                      )}
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-amber-50/50 rounded-xl p-4 border-l-4 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{userStats.pendingTests}</p>
                      )}
                    </div>
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <div className="bg-purple-50/50 rounded-xl p-4 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Assignments</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{userStats.totalAssignments}</p>
                      )}
                    </div>
                    <ClipboardList className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Details */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-medium text-gray-900">#{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Change Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
