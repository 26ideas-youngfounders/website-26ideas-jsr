import { ChevronDown } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { label: "Our Community", hasDropdown: true },
    { label: "Programmes", hasDropdown: false },
    { label: "Events", hasDropdown: true },
    { label: "Insights", hasDropdown: true },
  ];

  return (
    <nav className="w-full bg-background border-b border-nav-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-nav-text">26ideas</span>
              <span className="text-sm text-nav-text ml-1 -mt-1 font-light italic">
                Young Founders
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  <button className="flex items-center text-nav-text hover:text-nav-text-hover transition-colors duration-200 text-sm font-medium py-2">
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
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