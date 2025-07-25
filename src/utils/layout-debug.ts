
/**
 * Layout Debug Utility
 * 
 * This utility helps detect and automatically fix duplicate layout elements
 * (Navigation/Footer) that should only appear once per page.
 * 
 * Features:
 * - Detects duplicate navigation and footer elements
 * - Automatically removes duplicate elements
 * - Provides visual indicators for debugging
 * - Logs detailed information about layout issues
 * 
 * @author 26ideas Development Team
 * @version 2.0.0
 */

/**
 * Automatically remove duplicate layout elements from the DOM
 * Keeps the first occurrence and removes all subsequent duplicates
 */
const removeDuplicateElements = (selector: string, elementType: string) => {
  const elements = document.querySelectorAll(selector);
  
  if (elements.length > 1) {
    console.warn(`🔧 AUTO-FIXING: Removing ${elements.length - 1} duplicate ${elementType} elements`);
    
    // Remove all elements except the first one
    elements.forEach((element, index) => {
      if (index > 0) {
        console.log(`🗑️ Removing duplicate ${elementType} element #${index + 1}`);
        element.remove();
      }
    });
    
    console.log(`✅ ${elementType} duplicates removed - only 1 remains`);
  }
};

/**
 * Check for duplicate layout elements and automatically fix them
 * This function detects and removes duplicate navigation and footer elements
 */
export const checkForDuplicateLayouts = () => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return;

  console.log('🔍 Checking for duplicate layout elements...');

  // Check for multiple navigation elements with more specific selectors
  const navigationElements = document.querySelectorAll('nav[class*="bg-background"], nav[class*="border-b"]');
  if (navigationElements.length > 1) {
    console.error('❌ DUPLICATE HEADERS DETECTED:', navigationElements.length, 'navigation elements found');
    console.error('📍 Header elements:', navigationElements);
    console.error('🔍 This should never happen - Navigation should only be rendered in App.tsx');
    
    // Add visual indicator for duplicate headers before removal
    navigationElements.forEach((nav, index) => {
      if (index > 0) {
        (nav as HTMLElement).style.border = '3px solid red';
        (nav as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        console.log(`🚨 Marking duplicate header #${index + 1} with red border`);
      }
    });
    
    // Auto-remove duplicates after a brief delay for visual feedback
    setTimeout(() => {
      removeDuplicateElements('nav[class*="bg-background"], nav[class*="border-b"]', 'Navigation');
    }, 500);
  }

  // Check for multiple footer elements
  const footerElements = document.querySelectorAll('footer[class*="bg-background"], footer[class*="border-t"]');
  if (footerElements.length > 1) {
    console.error('❌ DUPLICATE FOOTERS DETECTED:', footerElements.length, 'footer elements found');
    console.error('📍 Footer elements:', footerElements);
    console.error('🔍 This should never happen - Footer should only be rendered in App.tsx');
    
    // Add visual indicator for duplicate footers before removal
    footerElements.forEach((footer, index) => {
      if (index > 0) {
        (footer as HTMLElement).style.border = '3px solid red';
        (footer as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        console.log(`🚨 Marking duplicate footer #${index + 1} with red border`);
      }
    });
    
    // Auto-remove duplicates after a brief delay for visual feedback
    setTimeout(() => {
      removeDuplicateElements('footer[class*="bg-background"], footer[class*="border-t"]', 'Footer');
    }, 500);
  }

  // Check for admin headers when not on admin pages
  const adminHeaders = document.querySelectorAll('header');
  const isAdminPage = window.location.pathname.includes('/admin/');
  
  if (adminHeaders.length > 0 && !isAdminPage) {
    console.warn('⚠️ Admin headers detected on non-admin page');
  }

  // Log successful single layout detection
  if (navigationElements.length === 1 && footerElements.length <= 1) {
    console.log('✅ Layout check passed - single navigation detected');
  }
};

/**
 * Start monitoring for duplicate layout elements
 * This function sets up automatic detection and fixing of layout duplicates
 */
export const startLayoutMonitoring = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🚀 Starting layout monitoring system...');
  console.log('📝 CRITICAL: Navigation and Footer should ONLY be rendered in App.tsx');
  console.log('🚫 DO NOT import Navigation/Footer in individual pages');

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
  
  // Monitor for DOM mutations that might indicate duplicate rendering
  const observer = new MutationObserver((mutations) => {
    // Only check if new elements are added
    const hasNewElements = mutations.some(mutation => 
      mutation.type === 'childList' && mutation.addedNodes.length > 0
    );
    
    if (hasNewElements) {
      setTimeout(checkForDuplicateLayouts, 50);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Layout monitoring system active');
};

/**
 * Emergency function to manually remove all duplicate layout elements
 * Call this function from browser console if duplicates persist
 */
export const emergencyCleanup = () => {
  console.log('🚨 EMERGENCY CLEANUP: Removing all duplicate layout elements');
  removeDuplicateElements('nav[class*="bg-background"], nav[class*="border-b"]', 'Navigation');
  removeDuplicateElements('footer[class*="bg-background"], footer[class*="border-t"]', 'Footer');
  console.log('🧹 Emergency cleanup completed');
};

// Make emergency cleanup available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup;
}
