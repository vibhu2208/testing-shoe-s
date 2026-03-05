import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, verifyToken } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      verifyToken();
    }
  }, [isAuthenticated, verifyToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
