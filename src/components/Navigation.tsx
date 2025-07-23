import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const Navigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { 
      label: "Our Community", 
      hasDropdown: true,
      link: "/community",
      dropdownItems: [
        { name: "Young Founders League", link: "/community/young-founders-league" },
        { name: "Chapters", link: "/community/chapters" },
        { name: "Campus Ambassadors", link: "/community/campus-ambassadors" },
        { name: "Alumni", link: "/community/alumni" },
        { name: "Mentors", link: "/community/mentors" },
        { name: "Partners", link: "/community/partners" }
      ]
    },
    { label: "Programmes", hasDropdown: false, link: "/programmes" },
    { 
      label: "Events", 
      hasDropdown: true,
      link: "/events",
      dropdownItems: [
        { name: "Young Founders Floor", link: "/events/youngfoundersfloor" },
        { name: "Annual Retreat", link: "/events/annual-retreat" },
        { name: "Webinars", link: "/webinars" },
        { name: "Women Founders Meetup", link: "/events/women-founders-meetup" }
      ]
    },
    { 
      label: "Insights", 
      hasDropdown: true,
      link: "/insights",
      dropdownItems: [
        { name: "Blogs", link: "/insights/blogs" },
        { name: "Newsletters", link: "/insights/newsletters" },
        { name: "Articles", link: "/insights/articles" }
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
    <nav className="w-full bg-background border-b border-nav-border relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
                  {item.hasDropdown ? (
                    <button 
                      className="flex items-center text-nav-text hover:text-nav-text-hover transition-colors duration-200 text-sm font-medium py-2"
                      onClick={() => {
                        setActiveDropdown(activeDropdown === item.label ? null : item.label);
                      }}
                    >
                      {item.label}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    </button>
                  ) : (
                    <Link
                      to={item.link || "#"}
                      className="flex items-center text-nav-text hover:text-nav-text-hover transition-colors duration-200 text-sm font-medium py-2"
                    >
                      {item.label}
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.label && item.dropdownItems && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-dropdown-bg border border-dropdown-border rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            to={dropdownItem.link}
                            className="block px-4 py-3 text-sm text-nav-text hover:bg-dropdown-item-hover hover:text-nav-text transition-colors duration-150 cursor-pointer"
                            onClick={() => {
                              setActiveDropdown(null);
                            }}
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sign In Button */}
          <div className="hidden md:block">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
              Sign In
            </button>
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
    </nav>
  );
};

export default Navigation;