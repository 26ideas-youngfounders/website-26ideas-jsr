
/**
 * @fileoverview Main navigation component for the 26ideas Young Founders platform.
 * 
 * Provides the primary navigation interface with dropdown menus for different
 * sections of the platform, user authentication controls, and responsive design
 * for both desktop and mobile devices.
 * 
 * Features:
 * - Hierarchical dropdown navigation
 * - User authentication integration
 * - Mobile-responsive design
 * - Click-outside-to-close functionality
 * - Dynamic routing based on user state
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

// Icons and UI Components
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// React Hooks and Router
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Internal Components and Hooks
import { useAuth } from "@/hooks/useAuth";
import SignInModal from "@/components/SignInModal";

/**
 * Navigation Component
 * 
 * Main navigation bar that appears at the top of every page.
 * Handles user authentication state, dropdown menus, and responsive design.
 * 
 * @returns {JSX.Element} The complete navigation bar component
 */
const Navigation = () => {
  // State for dropdown menu management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Individual references for each dropdown to prevent conflicts
  const communityDropdownRef = useRef<HTMLDivElement>(null);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);
  const insightsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Authentication state and functions
  const { user, signOut } = useAuth();
  
  // Navigation hook for programmatic routing
  const navigate = useNavigate();

  /**
   * Navigation menu structure configuration
   * Defines the main navigation items and their dropdown contents
   */
  const navItems = [
    { 
      label: "Our Community", 
      hasDropdown: true,
      dropdownItems: [
        "Young Founders League",
        "Chapters", 
        "Campus Ambassadors",
        "Alumni",
        "Mentors", // Links to /community/mentors route
        "Partners"
      ],
      ref: communityDropdownRef
    },
    { 
      label: "Programmes", 
      hasDropdown: false // Simple navigation item without dropdown
    },
    { 
      label: "Events", 
      hasDropdown: true,
      dropdownItems: [
        "Young Founders Floor",
        "Annual Retreat",
        "Women Founders Meetup"
      ],
      ref: eventsDropdownRef
    },
    { 
      label: "Insights", 
      hasDropdown: true,
      dropdownItems: [
        "Blogs",
        "Newsletters",
        "Articles"
      ],
      ref: insightsDropdownRef
    },
  ];

  /**
   * Effect hook to handle clicking outside dropdown menus
   * Closes any open dropdown when user clicks outside the navigation area
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside all dropdown refs
      const isOutsideAllDropdowns = [
        communityDropdownRef,
        eventsDropdownRef,
        insightsDropdownRef
      ].every(ref => !ref.current?.contains(target));
      
      if (isOutsideAllDropdowns) {
        setActiveDropdown(null);
      }
    };

    // Add event listener for mouse clicks
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Closes the active dropdown menu
   */
  const closeDropdown = () => {
    console.log('🔄 Closing dropdown');
    setActiveDropdown(null);
  };

  /**
   * Handles navigation for special dropdown items with debugging
   * @param {string} itemName - The name of the dropdown item
   */
  const handleSpecialNavigation = (itemName: string) => {
    console.log('🚀 handleSpecialNavigation called with:', itemName);
    
    try {
      // Close dropdown immediately
      console.log('🔄 Closing dropdown before navigation');
      setActiveDropdown(null);
      
      // Navigate immediately without setTimeout to avoid any timing issues
      switch (itemName) {
        case "Young Founders Floor":
          console.log('📍 Navigating to /young-founders-floor');
          navigate("/young-founders-floor");
          console.log('✅ Navigation call completed');
          break;
        default:
          console.log('⚠️ No navigation defined for:', itemName);
          break;
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback: try using window.location as backup
      if (itemName === "Young Founders Floor") {
        console.log('🔄 Fallback: Using window.location');
        window.location.href = "/young-founders-floor";
      }
    }
  };

  /**
   * Route mapping function for dropdown items
   * Maps specific dropdown items to their corresponding routes
   * @param {string} itemName - The name of the dropdown item
   * @returns {string} The route path for the item
   */
  const getItemRoute = (itemName: string) => {
    switch (itemName) {
      case "Mentors":
        return "/community/mentors"; // Mentor signup page
      default:
        return "#"; // Placeholder for future routes
    }
  };

  /**
   * Checks if an item needs special navigation handling
   * @param {string} itemName - The name of the dropdown item
   * @returns {boolean} True if item needs special handling
   */
  const needsSpecialNavigation = (itemName: string) => {
    return itemName === "Young Founders Floor";
  };

  return (
    <nav className="w-full bg-background border-b border-nav-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/72856c44-6ead-48de-8838-a00fe8990bad.png" 
                alt="26ideas Young Founders" 
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item, index) => (
                <div key={item.label} className="relative group" ref={item.ref || null}>
                  <button 
                    className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200 text-sm font-medium py-2"
                    onClick={() => {
                      if (item.hasDropdown) {
                        console.log('📋 Dropdown clicked:', item.label);
                        setActiveDropdown(activeDropdown === item.label ? null : item.label);
                      }
                    }}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.label && item.dropdownItems && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems.map((dropdownItem) => {
                          if (needsSpecialNavigation(dropdownItem)) {
                            return (
                              <button
                                key={dropdownItem}
                                type="button"
                                className="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:bg-gray-100"
                                onClick={(e) => {
                                  console.log('🖱️ Special navigation button clicked:', dropdownItem);
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSpecialNavigation(dropdownItem);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    console.log('⌨️ Special navigation key pressed:', e.key, dropdownItem);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSpecialNavigation(dropdownItem);
                                  }
                                }}
                              >
                                {dropdownItem}
                              </button>
                            );
                          }
                          
                          return (
                            <Link
                              key={dropdownItem}
                              to={getItemRoute(dropdownItem)}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                              onClick={() => {
                                console.log('🔗 Regular link clicked:', dropdownItem);
                                setActiveDropdown(null);
                              }}
                            >
                              {dropdownItem}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sign In/Out Button */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
                <Button 
                  onClick={signOut}
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsSignInModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="text-gray-700 hover:text-gray-900 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <div key={item.label} className="space-y-2">
                  <button
                    className="flex items-center justify-between w-full text-left text-gray-700 hover:text-gray-900 font-medium py-2"
                    onClick={() => {
                      if (item.hasDropdown) {
                        setActiveDropdown(activeDropdown === item.label ? null : item.label);
                      }
                    }}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                  
                  {/* Mobile Dropdown Items */}
                  {item.hasDropdown && activeDropdown === item.label && item.dropdownItems && (
                    <div className="pl-4 space-y-2">
                      {item.dropdownItems.map((dropdownItem) => {
                        if (needsSpecialNavigation(dropdownItem)) {
                          return (
                            <button
                              key={dropdownItem}
                              type="button"
                              className="block w-full text-left py-2 text-sm text-gray-600 hover:text-gray-900"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMobileMenuOpen(false);
                                handleSpecialNavigation(dropdownItem);
                              }}
                            >
                              {dropdownItem}
                            </button>
                          );
                        }
                        
                        return (
                          <Link
                            key={dropdownItem}
                            to={getItemRoute(dropdownItem)}
                            className="block py-2 text-sm text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setActiveDropdown(null);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {dropdownItem}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Sign In/Out Section */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Welcome, {user.email}
                    </div>
                    <Button 
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      setIsSignInModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </nav>
  );
};

export default Navigation;
