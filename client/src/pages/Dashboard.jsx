import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { dashboardAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard statistics';
      setError(errorMessage);
      console.error('Dashboard stats error:', err);
      
      // Set default stats if API fails
      setStats({
        assignments: { total: 0, assigned: 0, in_progress: 0, approved: 0 },
        pendingApprovals: 0,
        reportsGenerated: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't return early on error, show dashboard with error message instead

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome to your {user?.role?.replace('_', ' ')} dashboard
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <div className="mr-2">⚠️</div>
            <div>
              <strong>Dashboard Warning:</strong> {error}
              <br />
              <small>Showing default values. Please check your connection and try refreshing.</small>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assignments"
          value={stats?.assignments?.total || 0}
          icon={ClipboardList}
          color="blue"
        />
        
        <StatCard
          title="Pending Tests"
          value={stats?.assignments?.assigned + stats?.assignments?.in_progress || 0}
          icon={Clock}
          color="yellow"
        />
        
        <StatCard
          title="Completed Tests"
          value={stats?.assignments?.approved || 0}
          icon={CheckCircle}
          color="green"
        />
        
        {user?.role === 'qa_manager' || user?.role === 'admin' ? (
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={FileText}
            color="orange"
          />
        ) : (
          <StatCard
            title="Reports Generated"
            value={stats?.reportsGenerated || 0}
            icon={FileText}
            color="purple"
          />
        )}
      </div>

      {/* Assignment Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Status</CardTitle>
            <CardDescription>Current status of all assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Assigned</span>
                </div>
                <span className="font-medium">{stats?.assignments?.assigned || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="font-medium">{stats?.assignments?.in_progress || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm">Submitted</span>
                </div>
                <span className="font-medium">{stats?.assignments?.submitted || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Approved</span>
                </div>
                <span className="font-medium">{stats?.assignments?.approved || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="font-medium">{stats?.assignments?.rejected || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Pass/Fail ratio of completed tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Passed</span>
                </div>
                <span className="font-medium">{stats?.executions?.pass || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm">Failed</span>
                </div>
                <span className="font-medium">{stats?.executions?.fail || 0}</span>
              </div>
              
              {stats?.executions?.total > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pass Rate</span>
                    <span className="font-medium">
                      {Math.round((stats.executions.pass / stats.executions.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest test assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{activity.template?.name}</p>
                    <p className="text-sm text-gray-600">
                      {activity.productName} - Batch: {activity.batchNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assigned to: {activity.tester?.firstName} {activity.tester?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      activity.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
