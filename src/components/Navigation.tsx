
/**
 * @fileoverview Main Navigation Component
 * 
 * Responsive navigation with authentication state handling,
 * user profile display, and clean mobile menu functionality.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import SignInModal from './SignInModal';

/**
 * Navigation Component
 * 
 * Provides site-wide navigation with:
 * - Responsive design for mobile and desktop
 * - Authentication state management
 * - User profile display when logged in
 * - Clean mobile menu with proper accessibility
 * 
 * @returns JSX.Element - The complete navigation component
 */
const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

  console.log('Navigation - User profile data:', userProfile);
  console.log('Navigation - First name available:', userProfile?.first_name);

  /**
   * Navigation links configuration
   * Defines all main navigation items
   */
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/annual-retreat', label: 'Annual Retreat' },
    { to: '/mentor-signup', label: 'Become a Mentor' },
    { to: '/yff', label: 'Young Founders Floor' },
  ];

  /**
   * Checks if a navigation link is currently active
   * @param path - The path to check
   * @returns boolean - Whether the path is active
   */
  const isActiveLink = (path: string): boolean => {
    return location.pathname === path;
  };

  /**
   * Handles user sign out with error handling
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Toggles mobile menu visibility
   */
  const toggleMenu = (): void => {
    setIsOpen(!isOpen);
  };

  /**
   * Closes mobile menu when link is clicked
   */
  const closeMobileMenu = (): void => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex-shrink-0 flex items-center"
              onClick={closeMobileMenu}
            >
              <span className="text-2xl font-bold text-primary">26ideas</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink(link.to)
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Desktop Authentication */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {userProfile?.first_name ? (
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Welcome, {userProfile.first_name}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Welcome
                    </span>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActiveLink(link.to)
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Authentication */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    {userProfile?.first_name ? (
                      <div className="px-3 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Welcome, {userProfile.first_name}
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Welcome
                      </div>
                    )}
                    <div className="px-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          handleSignOut();
                          closeMobileMenu();
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setShowSignIn(true);
                        closeMobileMenu();
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignIn} 
        onClose={() => setShowSignIn(false)}
        onSuccess={() => {
          setShowSignIn(false);
          console.log('✅ Authentication successful - modal closed');
        }}
      />
    </nav>
  );
};

export default Navigation;
