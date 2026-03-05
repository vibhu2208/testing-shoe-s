import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Assignments from './pages/Assignments';
import Executions from './pages/Executions';
import QAApproval from './pages/QAApproval';
import Reports from './pages/Reports';
import Users from './pages/Users';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
const Profile = () => <div>User Profile</div>;
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
    </div>
  </div>
);

function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
              } 
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Admin Only Routes */}
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin & Company Routes */}
              <Route 
                path="templates" 
                element={
                  <ProtectedRoute requiredRoles={['admin', 'company']}>
                    <Templates />
                  </ProtectedRoute>
                } 
              />
              
              {/* All authenticated users */}
              <Route path="assignments" element={<Assignments />} />
              <Route path="executions" element={<Executions />} />
              <Route path="profile" element={<Profile />} />
              
              {/* QA Manager & Admin Routes */}
              <Route 
                path="qa-approval" 
                element={
                  <ProtectedRoute requiredRoles={['qa_manager', 'admin']}>
                    <QAApproval />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reports - Admin, QA Manager, Company */}
              <Route 
                path="reports" 
                element={
                  <ProtectedRoute requiredRoles={['admin', 'qa_manager', 'company']}>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
