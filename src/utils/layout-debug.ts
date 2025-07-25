
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

  // Check for multiple navigation elements with more specific selectors
  const navigationElements = document.querySelectorAll('nav[class*="bg-background"], nav[class*="border-b"]');
  if (navigationElements.length > 1) {
    console.error('❌ DUPLICATE HEADERS DETECTED:', navigationElements.length, 'navigation elements found');
    console.error('📍 Header elements:', navigationElements);
    console.error('🔍 Check App.tsx and ensure Navigation is only rendered once');
    
    // Add visual indicator for duplicate headers
    navigationElements.forEach((nav, index) => {
      if (index > 0) {
        (nav as HTMLElement).style.border = '3px solid red';
        (nav as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      }
    });
  }

  // Check for multiple footer elements
  const footerElements = document.querySelectorAll('footer[class*="bg-background"], footer[class*="border-t"]');
  if (footerElements.length > 1) {
    console.error('❌ DUPLICATE FOOTERS DETECTED:', footerElements.length, 'footer elements found');
    console.error('📍 Footer elements:', footerElements);
    console.error('🔍 Check App.tsx and ensure Footer is only rendered once');
    
    // Add visual indicator for duplicate footers
    footerElements.forEach((footer, index) => {
      if (index > 0) {
        (footer as HTMLElement).style.border = '3px solid red';
        (footer as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      }
    });
  }

  // Check for admin headers when not on admin pages
  const adminHeaders = document.querySelectorAll('header');
  const isAdminPage = window.location.pathname.includes('/admin/');
  
  if (adminHeaders.length > 0 && !isAdminPage) {
    console.warn('⚠️ ADMIN HEADER ON NON-ADMIN PAGE:', window.location.pathname);
  }

  // Log successful single layout detection
  if (navigationElements.length === 1 && footerElements.length <= 1) {
    console.log('✅ Layout check passed - single header detected');
  }
};

/**
 * Monitors for layout changes and runs duplicate detection
 * Useful for detecting issues during navigation
 */
export const startLayoutMonitoring = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Run initial check after DOM is ready
  setTimeout(checkForDuplicateLayouts, 100);

  // Monitor for route changes
  let lastPath = window.location.pathname;
  const checkPathChange = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      console.log('🔄 Route changed to:', lastPath);
      setTimeout(checkForDuplicateLayouts, 100);
    }
  };

  // Check for path changes every 500ms
  setInterval(checkPathChange, 500);
  
  // Also monitor for DOM mutations that might indicate duplicate rendering
  const observer = new MutationObserver(() => {
    setTimeout(checkForDuplicateLayouts, 50);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};
