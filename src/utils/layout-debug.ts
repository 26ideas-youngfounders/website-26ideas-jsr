
/**
 * @fileoverview Layout debugging utilities
 * 
 * Provides functions to detect and warn about duplicate headers/footers
 * to prevent layout issues in development.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

/**
 * Checks for duplicate header/footer elements and logs warnings
 * Should be called in development to catch layout issues early
 */
export const checkForDuplicateLayouts = () => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return;

  // Check for multiple navigation elements
  const navigationElements = document.querySelectorAll('nav[class*="bg-background"]');
  if (navigationElements.length > 1) {
    console.warn('⚠️ DUPLICATE HEADERS DETECTED:', navigationElements.length, 'navigation elements found');
    console.warn('📍 Header elements:', navigationElements);
  }

  // Check for multiple footer elements
  const footerElements = document.querySelectorAll('footer[class*="bg-background"]');
  if (footerElements.length > 1) {
    console.warn('⚠️ DUPLICATE FOOTERS DETECTED:', footerElements.length, 'footer elements found');
    console.warn('📍 Footer elements:', footerElements);
  }

  // Check for admin headers when not on admin pages
  const adminHeaders = document.querySelectorAll('header:has(h1:contains("Admin CRM"))');
  const isAdminPage = window.location.pathname.includes('/admin/');
  
  if (adminHeaders.length > 0 && !isAdminPage) {
    console.warn('⚠️ ADMIN HEADER ON NON-ADMIN PAGE:', window.location.pathname);
  }

  // Log successful single layout detection
  if (navigationElements.length === 1 && footerElements.length === 1) {
    console.log('✅ Layout check passed - single header and footer detected');
  }
};

/**
 * Monitors for layout changes and runs duplicate detection
 * Useful for detecting issues during navigation
 */
export const startLayoutMonitoring = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Run initial check
  setTimeout(checkForDuplicateLayouts, 100);

  // Monitor for route changes
  let lastPath = window.location.pathname;
  const checkPathChange = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(checkForDuplicateLayouts, 100);
    }
  };

  // Check for path changes every 500ms
  setInterval(checkPathChange, 500);
};
