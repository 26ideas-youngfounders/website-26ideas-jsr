
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'yff_admin' | 'mentor_admin';
}

const AdminAuth: React.FC<AdminAuthProps> = ({ children, requiredRole = 'admin' }) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // First get the individual_id for this user
        const { data: individual, error: individualError } = await supabase
          .from('individuals')
          .select('individual_id')
          .eq('email', user.email)
          .single();

        if (individualError || !individual) {
          setError('User profile not found. Please contact an administrator.');
          setLoading(false);
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

        if (roleError || !roleData) {
          setError('Access denied. You do not have admin permissions.');
          setLoading(false);
          return;
        }

        setUserRole(roleData.role);
        setLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setError('Error verifying permissions. Please try again.');
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Show login required
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please sign in with an admin account to access the CRM system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Insufficient Permissions</CardTitle>
            <CardDescription>
              Your account ({userRole}) does not have permission to access this area.
              Required role: {requiredRole}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/admin/crm-dashboard'}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required role - render children
  return <>{children}</>;
};

export default AdminAuth;
