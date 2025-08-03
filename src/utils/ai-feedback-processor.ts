
/**
 * AI Feedback Text Processing Utilities
 * 
 * Provides preprocessing functions to ensure consistent formatting
 * of AI-generated feedback before rendering in markdown
 */

/**
 * This function guarantees no list bullets are ever split across lines in AI feedback.
 * All partial lines (non-bullet, non-heading) are always merged with the prior bullet.
 * It is applied to every AI feedback string before markdown rendering.
 * 
 * Fixes orphaned bullet points in AI feedback text by merging lines that don't start 
 * with proper bullet points as continuation of the previous list item.
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines - they're intentional formatting/spacing
    if (trimmed === '') {
      processedLines.push('');
      continue;
    }
    
    // Check if this line starts with a proper bullet point, number, or heading marker
    const isBulletPoint = /^(- |• |\* |\d+\.\s)/.test(trimmed);
    const isHeading = /^(\*\*[^*]+\*\*|__|#{1,6}\s)/.test(trimmed); // Bold text or markdown heading
    const isStandaloneFormat = isBulletPoint || isHeading;
    
    if (isStandaloneFormat) {
      // This is a proper list item or heading - add it as-is
      processedLines.push(trimmed);
    } else {
      // This appears to be a continuation of a previous line
      // Find the last non-empty line to merge with
      let lastIndex = processedLines.length - 1;
      while (lastIndex >= 0 && processedLines[lastIndex].trim() === '') {
        lastIndex--;
      }
      
      if (lastIndex >= 0) {
        // Merge it with the last non-empty line (separated by a space if needed)
        const lastLine = processedLines[lastIndex];
        const needsSpace = lastLine.length > 0 && !lastLine.endsWith(' ') && !trimmed.startsWith(' ');
        processedLines[lastIndex] = lastLine + (needsSpace ? ' ' : '') + trimmed;
      } else {
        // No previous line found - keep it as-is
        processedLines.push(trimmed);
      }
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
      /^(- |• |\* |\d+\.\s)/.test(previousLine) &&
      currentLine.length < 50 &&
      !/^(- |• |\* |\d+\.\s|\*\*[^*]+\*\*|__|#{1,6}\s)/.test(currentLine)
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

  // Apply orphaned bullet fix first - this is the most important step
  let processed = fixOrphanedBullets(rawFeedback);
  
  // Additional cleanup: ensure consistent spacing and remove asterisk bullets
  processed = processed
    // Remove excessive whitespace but preserve intentional double line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headings
    .replace(/(\*\*[^*]+\*\*)\n(?!\n)/g, '$1\n\n')
    // Clean up any remaining asterisk bullets - convert to dashes
    .replace(/^\* /gm, '- ')
    // Remove any trailing spaces from lines
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  // Apply the fix one more time to catch any edge cases from the cleanup
  processed = fixOrphanedBullets(processed);

  return processed.trim();
}
