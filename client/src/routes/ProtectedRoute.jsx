import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xl animate-pulse shadow-md">
          EF
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)]">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Verifying ExamForge session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to /login (preserving state for post-login return if needed)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if allowedRoles provided
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect user to their own authorized role dashboard
    const userRole = user.role;
    if (userRole === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (userRole === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
    if (userRole === 'SUPER_ADMIN' || userRole === 'INSTITUTION_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};
