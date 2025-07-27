
/**
 * @fileoverview Admin Authentication Guard Component
 * 
 * Protects admin routes and ensures only users with proper admin roles
 * can access the CRM system. Checks user_roles table for permissions.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLoginForm } from './AdminLoginForm';

interface AdminAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'yff_admin' | 'mentor_admin';
}

const AdminAuth: React.FC<AdminAuthProps> = ({ children, requiredRole = 'admin' }) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        setShowLoginForm(true);
        return;
      }

      try {
        console.log('Checking admin permissions for user:', user.email);

        // First get the individual_id for this user
        const { data: individual, error: individualError } = await supabase
          .from('individuals')
          .select('individual_id')
          .eq('email', user.email)
          .single();

        console.log('Individual lookup result:', { individual, individualError });

        if (individualError) {
          console.error('Individual lookup error:', individualError);
          setLoading(false);
          setShowLoginForm(true);
          return;
        }

        if (!individual) {
          setLoading(false);
          setShowLoginForm(true);
          return;
        }

        // Get user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('individual_id', individual.individual_id)
          .eq('is_active', true)
          .single();

        console.log('Role lookup result:', { roleData, roleError });

        if (roleError) {
          console.error('Role lookup error:', roleError);
          setLoading(false);
          setShowLoginForm(true);
          return;
        }

        if (!roleData) {
          setLoading(false);
          setShowLoginForm(true);
          return;
        }

        console.log('User role found:', roleData.role);
        setUserRole(roleData.role);
        setShowLoginForm(false);
        setLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
        setShowLoginForm(true);
      }
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  // Show login form if not authenticated or role check failed
  if (showLoginForm) {
    return <AdminLoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!userRole) return false;
    
    // Super admin has access to everything
    if (userRole === 'super_admin') return true;
    
    // Check specific role requirements
    switch (requiredRole) {
      case 'super_admin':
        return userRole === 'super_admin';
      case 'admin':
        return ['super_admin', 'admin'].includes(userRole);
      case 'yff_admin':
        return ['super_admin', 'admin', 'yff_admin'].includes(userRole);
      case 'mentor_admin':
        return ['super_admin', 'admin', 'mentor_admin'].includes(userRole);
      default:
        return false;
    }
  };

  // Show access denied if role doesn't match
  if (!hasRequiredRole()) {
    return <AdminLoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  // User is authenticated and has required role - render children
  return <>{children}</>;
};

export default AdminAuth;
