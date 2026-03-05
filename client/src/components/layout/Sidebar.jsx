import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  TestTube,
  CheckCircle,
  FileBarChart,
  Settings,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, hasRole, hasAnyRole } = useAuthStore();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'tester', 'qa_manager', 'company']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Test Templates',
      href: '/templates',
      icon: FileText,
      roles: ['admin', 'company']
    },
    {
      name: 'Assignments',
      href: '/assignments',
      icon: ClipboardList,
      roles: ['admin', 'tester', 'qa_manager', 'company']
    },
    {
      name: 'Test Execution',
      href: '/executions',
      icon: TestTube,
      roles: ['tester', 'qa_manager', 'company']
    },
    {
      name: 'QA Approval',
      href: '/qa-approval',
      icon: CheckCircle,
      roles: ['qa_manager', 'admin']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileBarChart,
      roles: ['admin', 'qa_manager', 'company']
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-xl font-bold">Testing System</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          if (!hasAnyRole(item.roles)) return null;
          
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Link
            to="/profile"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-4 w-4" />
            Profile
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
