import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/SignInModal";

const Navigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  const navItems = [
    { 
      label: "Our Community", 
      hasDropdown: true,
      dropdownItems: [
        "Young Founders League",
        "Chapters", 
        "Campus Ambassadors",
        "Alumni",
        "Mentors", 
        "Partners"
      ]
    },
    { label: "Programmes", hasDropdown: false },
    { 
      label: "Events", 
      hasDropdown: true,
      dropdownItems: [
        "Young Founders Floor",
        "Annual Retreat",
        "Women Founders Meetup"
      ]
    },
    { 
      label: "Insights", 
      hasDropdown: true,
      dropdownItems: [
        "Blogs",
        "Newsletters",
        "Articles"
      ]
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
                <div key={item.label} className="relative group" ref={item.hasDropdown ? dropdownRef : null}>
                  <button 
                    className="flex items-center text-nav-text hover:text-nav-text-hover transition-colors duration-200 text-sm font-medium py-2"
                    onClick={() => {
                      if (item.hasDropdown) {
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
                    <div className="absolute top-full left-0 mt-1 w-56 bg-dropdown-bg border border-dropdown-border rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems.map((dropdownItem) => {
                          // Define specific routes for certain dropdown items
                          const getItemRoute = (itemName: string) => {
                            switch (itemName) {
                              case "Mentors":
                                return "/community/mentors";
                              default:
                                return "#";
                            }
                          };

                          return (
                            <Link
                              key={dropdownItem}
                              to={getItemRoute(dropdownItem)}
                              className="block px-4 py-3 text-sm text-nav-text hover:bg-dropdown-item-hover hover:text-nav-text transition-colors duration-150"
                              onClick={() => setActiveDropdown(null)}
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
            <button className="text-nav-text hover:text-nav-text-hover p-2">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
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