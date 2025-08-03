/**
 * AI Feedback Text Processing Utilities
 * 
 * Provides preprocessing functions to ensure consistent formatting
 * of AI-generated feedback before rendering in markdown
 */

/**
 * Fixes orphaned bullet points in AI feedback text
 * 
 * Preprocessing ensures AI feedback list items are kept on one line, never split.
 * Merges lines that don't start with proper bullet points as continuation 
 * of the previous list item, ensuring coherent formatting.
 * 
 * @param feedback - Raw AI feedback text that may contain split bullets
 * @returns Processed feedback with orphaned lines merged into proper bullets
 */
export function fixOrphanedBullets(feedback: string): string {
  if (!feedback || typeof feedback !== 'string') {
    return feedback || '';
  }

  // Split into lines and process each one
  const lines = feedback.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines - they're intentional formatting
    if (trimmed === '') {
      processedLines.push(trimmed);
      continue;
    }
    
    // Check if this line starts with a proper bullet point or heading marker
    const isListItem = /^(- |• |\d+\. )/.test(trimmed);
    const isHeading = /^(\*\*|__|#{1,6}\s)/.test(trimmed); // Bold text or markdown heading
    const isStandaloneFormat = isListItem || isHeading;
    
    if (isStandaloneFormat) {
      // This is a proper list item or heading - add it as-is
      processedLines.push(trimmed);
    } else if (processedLines.length > 0) {
      // This appears to be a continuation of the previous line
      // Merge it with the previous line (separated by a space)
      const lastIndex = processedLines.length - 1;
      processedLines[lastIndex] += ' ' + trimmed;
    } else {
      // First line but not a proper format - keep it as-is
      processedLines.push(trimmed);
    }
  }

  return processedLines.join('\n');
}

/**
 * Validates that AI feedback follows expected formatting rules
 * 
 * @param feedback - Processed AI feedback text
 * @returns Object with validation results and suggestions
 */
export function validateFeedbackFormat(feedback: string): {
  isValid: boolean;
  issues: string[];
  hasAsterisks: boolean;
  hasOrphanedBullets: boolean;
} {
  const lines = feedback.split('\n').map(line => line.trim()).filter(Boolean);
  const issues: string[] = [];
  
  // Check for asterisk bullets (should use dashes instead)
  const hasAsterisks = lines.some(line => line.startsWith('* '));
  if (hasAsterisks) {
    issues.push('Found asterisk bullets (should use dashes)');
  }
  
  // Check for potential orphaned bullets (short lines following list items)
  let hasOrphanedBullets = false;
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const previousLine = lines[i - 1];
    
    // If previous line was a bullet and current line is short and doesn't start with bullet/heading
    if (
      /^(- |• |\d+\. )/.test(previousLine) &&
      currentLine.length < 50 &&
      !/^(- |• |\d+\. |\*\*|__|#{1,6}\s)/.test(currentLine)
    ) {
      hasOrphanedBullets = true;
      issues.push(`Potential orphaned bullet: "${currentLine}"`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    hasAsterisks,
    hasOrphanedBullets
  };
}

/**
 * Comprehensive feedback processing pipeline
 * 
 * Applies all necessary preprocessing to ensure consistent formatting
 * 
 * @param rawFeedback - Raw AI feedback text
 * @returns Cleaned and formatted feedback text
 */
export function processFeedbackText(rawFeedback: string): string {
  if (!rawFeedback || typeof rawFeedback !== 'string') {
    return '';
  }

  // Apply orphaned bullet fix
  let processed = fixOrphanedBullets(rawFeedback);
  
  // Additional cleanup: ensure consistent spacing
  processed = processed
    // Remove excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headings
    .replace(/(\*\*[^*]+\*\*)\n(?!\n)/g, '$1\n\n')
    // Clean up any remaining asterisk bullets
    .replace(/^\* /gm, '- ');

  return processed.trim();
}
