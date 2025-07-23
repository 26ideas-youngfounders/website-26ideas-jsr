
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
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'yff_admin' | 'mentor_admin';
}

const AdminAuth: React.FC<AdminAuthProps> = ({ children, requiredRole = 'admin' }) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Checking admin permissions for user:', user.email);
        setError(null);
        setDebugInfo(null);

        // First get the individual_id for this user
        const { data: individual, error: individualError } = await supabase
          .from('individuals')
          .select('individual_id')
          .eq('email', user.email)
          .single();

        console.log('Individual lookup result:', { individual, individualError });

        if (individualError) {
          console.error('Individual lookup error:', individualError);
          if (individualError.code === 'PGRST116') {
            setError('No profile found for this user. Please contact an administrator to set up your profile.');
            setDebugInfo({
              userEmail: user.email,
              issue: 'No individual record found',
              suggestion: 'Admin needs to create an individual record for this email'
            });
          } else {
            setError('Error looking up user profile. Please try again.');
            setDebugInfo({ individualError });
          }
          setLoading(false);
          return;
        }

        if (!individual) {
          setError('User profile not found. Please contact an administrator.');
          setDebugInfo({
            userEmail: user.email,
            issue: 'Individual record is null'
          });
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

        console.log('Role lookup result:', { roleData, roleError });

        if (roleError) {
          console.error('Role lookup error:', roleError);
          if (roleError.code === 'PGRST116') {
            setError('No admin role assigned to this user. Please contact an administrator.');
            setDebugInfo({
              userEmail: user.email,
              userId: user.id,
              individualId: individual.individual_id,
              issue: 'No user_roles record found',
              suggestion: 'Admin needs to run: INSERT INTO user_roles (user_id, individual_id, role, is_active) VALUES (\'' + user.id + '\', \'' + individual.individual_id + '\', \'admin\', true);'
            });
          } else {
            setError('Error checking user permissions. Please try again.');
            setDebugInfo({ roleError });
          }
          setLoading(false);
          return;
        }

        if (!roleData) {
          setError('Access denied. You do not have admin permissions.');
          setDebugInfo({
            userEmail: user.email,
            issue: 'Role data is null'
          });
          setLoading(false);
          return;
        }

        console.log('User role found:', roleData.role);
        setUserRole(roleData.role);
        setLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setError('Error verifying permissions. Please try again.');
        setDebugInfo({ error: error.message });
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    // Trigger re-check by updating a state that causes useEffect to re-run
    window.location.reload();
  };

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

  // Show error state with debug information
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            {debugInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Debug Information:</h4>
                <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Return to Home
              </Button>
            </div>
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

  // User is authenticated and has required role - render children
  return <>{children}</>;
};

export default AdminAuth;
