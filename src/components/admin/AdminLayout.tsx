
/**
 * @fileoverview Admin Layout Component
 * 
 * Provides consistent layout structure for admin pages WITHOUT
 * rendering Navigation or Footer (handled by App.tsx globally).
 * Only renders admin-specific navigation and content wrapper.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  User,
  Menu,
  Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout Component
 * 
 * Provides admin-specific layout without duplicating global Navigation/Footer
 * Only renders admin navigation and content wrapper with distinct admin theme
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug logging to prevent duplicate headers
  console.log('🔧 AdminLayout rendering - should NOT render Navigation/Footer');

  const navigationItems = [
    { 
      path: '/admin/mentor-applications', 
      label: 'Mentor Applications', 
      icon: UserCheck 
    },
    { 
      path: '/admin/yff-applications', 
      label: 'YFF Applications', 
      icon: Users 
    },
    { 
      path: '/admin/analytics', 
      label: 'Analytics', 
      icon: BarChart3 
    },
    { 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: Settings 
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin-specific header with distinct theme - NOT the main Navigation */}
      <header className="bg-slate-900 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Admin Logo and Title with distinct styling */}
            <div className="flex items-center">
              <div className="flex items-center mr-8">
                <Shield className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-xs text-slate-300">Young Founders Platform</p>
                </div>
              </div>
              
              {/* Admin Badge to clearly identify admin zone */}
              <Badge variant="secondary" className="bg-blue-600 text-white border-blue-500">
                Admin Zone
              </Badge>
            </div>

            {/* Admin Navigation - only admin-specific items */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu with dark theme */}
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:inline-flex border-slate-600 text-slate-300">
                Admin User
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-800">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    <User className="h-4 w-4 mr-2" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu with dark theme */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content - wrapped with distinct background */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {children}
        </div>
      </main>
      
      {/* NO Footer rendered here - handled by App.tsx globally */}
    </div>
  );
};

export default AdminLayout;
