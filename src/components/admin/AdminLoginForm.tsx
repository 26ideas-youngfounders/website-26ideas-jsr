
/**
 * @fileoverview Admin Login Form Component
 * 
 * Provides a clean login interface specifically for admin access
 * with role validation and error handling.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: () => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with email and password
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Authentication failed. Please try again.');
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (roleError) {
        console.error('Role check error:', roleError);
        if (roleError.code === 'PGRST116') {
          setError('You do not have admin access. Please contact an administrator.');
        } else {
          setError('Error verifying permissions. Please try again.');
        }
        await supabase.auth.signOut();
        return;
      }

      const userRole = roleData?.role;
      
      if (!userRole || !['admin', 'super_admin', 'yff_admin', 'mentor_admin'].includes(userRole)) {
        setError('You do not have admin access.');
        await supabase.auth.signOut();
        return;
      }

      // Success - user has admin access
      console.log('Admin login successful:', { email, role: userRole });
      onLoginSuccess();

    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in with your admin credentials to access the CRM dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In to CRM
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need admin access?</p>
            <p className="mt-1">Contact your system administrator to get the required permissions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginForm;
