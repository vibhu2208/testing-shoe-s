import React, { useState } from 'react';
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
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, hasRole, hasAnyRole } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 ease-in-out shadow-sm",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Toggle */}
      <div className="flex items-center justify-between h-16 px-4 bg-green-600 text-white">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold truncate">Testing System</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          if (!hasAnyRole(item.roles)) return null;
          
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isCollapsed ? "mx-auto" : "mr-3"
              )} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-3">
        {!isCollapsed && (
          <div className="flex items-center mb-3 px-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <Link
            to="/profile"
            className={cn(
              "flex items-center px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Profile" : undefined}
          >
            <Settings className={cn(
              "h-4 w-4",
              isCollapsed ? "mx-auto" : "mr-3"
            )} />
            {!isCollapsed && "Profile"}
          </Link>
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={cn(
              "h-4 w-4",
              isCollapsed ? "mx-auto" : "mr-3"
            )} />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
