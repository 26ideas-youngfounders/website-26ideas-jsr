
/**
 * @fileoverview Admin Authentication Guard Component
 * 
 * Protects admin routes and ensures only users with super_admin role
 * can access the CRM system. Checks user_roles table for permissions.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLoginForm } from './AdminLoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
}

/**
 * Admin Authentication Guard - Only allows super_admin access
 */
const AdminAuth: React.FC<AdminAuthProps> = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      console.log('🔒 Checking super-admin access...');
      
      if (!user) {
        console.log('❌ No user found - showing login form');
        setLoading(false);
        setShowLoginForm(true);
        setAccessDenied(false);
        return;
      }

      try {
        console.log('🔍 Checking super-admin permissions for user:', user.email);

        // First get the individual_id for this user
        const { data: individual, error: individualError } = await supabase
          .from('individuals')
          .select('individual_id')
          .eq('email', user.email)
          .single();

        console.log('👤 Individual lookup result:', { individual, individualError });

        if (individualError || !individual) {
          console.error('❌ Individual lookup failed:', individualError);
          console.log('🚫 Access denied - user not found in individuals table');
          setAccessDenied(true);
          setShowLoginForm(false);
          setLoading(false);
          return;
        }

        // Check for super_admin role specifically
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('individual_id', individual.individual_id)
          .eq('role', 'super_admin')
          .eq('is_active', true)
          .single();

        console.log('🔑 Super-admin role lookup result:', { roleData, roleError });

        if (roleError || !roleData) {
          console.error('❌ Super-admin role check failed:', roleError);
          console.log('🚫 Access denied - user does not have super_admin role');
          setAccessDenied(true);
          setShowLoginForm(false);
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Success - user has super_admin role
        console.log('✅ Super-admin access granted for:', user.email);
        setUserRole(roleData.role);
        setAccessDenied(false);
        setShowLoginForm(false);
        setLoading(false);

      } catch (error) {
        console.error('💥 Unexpected error checking super-admin access:', error);
        console.log('🚫 Access denied due to error');
        setAccessDenied(true);
        setShowLoginForm(false);
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSuperAdminAccess();
    }
  }, [user, authLoading]);

  // Handle sign out
  const handleSignOut = async () => {
    console.log('🚪 Signing out user...');
    await signOut();
    setUserRole(null);
    setAccessDenied(false);
    setShowLoginForm(true);
  };

  // Handle going back to main site
  const handleGoBack = () => {
    console.log('🔙 Redirecting to main site...');
    window.location.href = '/';
  };

  // Show login form if not authenticated
  if (showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <Card className="mb-4">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="mt-4 text-2xl font-bold">Admin Access Required</CardTitle>
              <CardDescription>
                Sign in with your super-admin credentials to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full mb-4" 
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back to Main Site
              </Button>
            </CardContent>
          </Card>
          
          <AdminLoginForm onLoginSuccess={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-red-900">Access Denied</CardTitle>
            <CardDescription className="text-red-700">
              You do not have administrator privileges required to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Super-admin access required:</strong> This dashboard is restricted to users with super-administrator privileges. Please contact your system administrator if you believe you should have access.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1" 
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Verifying super-admin access...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has super_admin role - render admin content
  if (userRole === 'super_admin') {
    console.log('🎯 Rendering admin dashboard for super-admin user');
    return <>{children}</>;
  }

  // Fallback - should not reach here, but extra safety
  console.error('🚨 Unexpected state in AdminAuth - denying access');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-red-900">Access Error</CardTitle>
          <CardDescription className="text-red-700">
            An unexpected error occurred while verifying your access permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Main Site
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
