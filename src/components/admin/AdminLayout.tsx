
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout Component
 * 
 * Provides admin-specific layout without duplicating global Navigation/Footer
 * Only renders admin navigation and content wrapper
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug logging to prevent duplicate headers
  console.log('🔧 AdminLayout rendering - should NOT render Navigation/Footer');

  const navigationItems = [
    { 
      path: '/admin/crm', 
      label: 'Dashboard', 
      icon: LayoutDashboard 
    },
    { 
      path: '/admin/yff-applications', 
      label: 'YFF Applications', 
      icon: Users 
    },
    { 
      path: '/admin/mentor-applications', 
      label: 'Mentor Applications', 
      icon: UserCheck 
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
      {/* Admin-specific header - NOT the main Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Admin Logo and Title */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/72856c44-6ead-48de-8838-a00fe8990bad.png" 
                alt="26ideas" 
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin CRM</h1>
                <p className="text-xs text-gray-500">Young Founders Platform</p>
              </div>
            </div>

            {/* Admin Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:inline-flex">
                Admin User
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
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

              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
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

      {/* Admin Content - wrapped without additional layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* NO Footer rendered here - handled by App.tsx globally */}
    </div>
  );
};

export default AdminLayout;
