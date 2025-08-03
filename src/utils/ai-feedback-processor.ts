/**
 * AI Feedback Text Processing Utilities
 * 
 * Provides preprocessing functions to ensure consistent formatting
 * of AI-generated feedback before rendering in markdown
 */

/**
 * This function is REQUIRED. It enforces bullet integrity on all AI feedback and *must never be bypassed*.
 * ALL orphan/split bullet lines are merged before feedback is rendered as markdown.
 * 
 * MANDATORY: Eliminates ALL orphaned bullet points by merging any line that doesn't start 
 * with proper bullet points, headings, or empty lines into the previous line.
 * 
 * @param feedback - Raw AI feedback text that may contain split bullets
 * @returns Processed feedback with ALL orphaned lines merged into proper bullets
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
    
    // Empty lines are kept as-is for spacing
    if (trimmed === '') {
      processedLines.push('');
      continue;
    }
    
    // Check if this line starts with a legitimate marker
    const isBulletPoint = /^(- |• |\* |\d+\.\s)/.test(trimmed);
    const isHeading = /^(\*\*[^*]+\*\*|__|#{1,6}\s)/.test(trimmed);
    const isLegitimateStandalone = isBulletPoint || isHeading;
    
    if (isLegitimateStandalone) {
      // This is a proper bullet or heading - keep as-is
      processedLines.push(trimmed);
    } else {
      // MANDATORY MERGE: Any line that's not a bullet/heading gets merged with previous line
      let lastIndex = processedLines.length - 1;
      
      // Find the last non-empty line to merge with
      while (lastIndex >= 0 && processedLines[lastIndex].trim() === '') {
        lastIndex--;
      }
      
      if (lastIndex >= 0) {
        // Merge it with the last non-empty line (add space if needed)
        const lastLine = processedLines[lastIndex];
        const needsSpace = lastLine.length > 0 && !lastLine.endsWith(' ') && !trimmed.startsWith(' ');
        processedLines[lastIndex] = lastLine + (needsSpace ? ' ' : '') + trimmed;
      } else {
        // No previous line found - keep it as-is (edge case)
        processedLines.push(trimmed);
      }
    }
  }

  return processedLines.join('\n');
}

/**
 * BULLETPROOF merging function - runs the fix twice to catch any edge cases
 * This ensures 100% elimination of orphaned bullets regardless of AI output format
 */
export function bulletproofMergeBullets(feedback: string): string {
  if (!feedback || typeof feedback !== 'string') {
    return feedback || '';
  }

  // Run the fix twice to catch any nested edge cases
  let processed = fixOrphanedBullets(feedback);
  processed = fixOrphanedBullets(processed); // Second pass to catch any remaining orphans
  
  return processed;
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
      issues.push(`CRITICAL: Orphaned bullet detected: "${currentLine}"`);
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
 * MANDATORY: Applies bulletproof orphaned bullet elimination to ensure consistent formatting
 * 
 * @param rawFeedback - Raw AI feedback text
 * @returns Cleaned and formatted feedback text with NO orphaned bullets
 */
export function processFeedbackText(rawFeedback: string): string {
  if (!rawFeedback || typeof rawFeedback !== 'string') {
    return '';
  }

  // BULLETPROOF orphaned bullet fix - this is MANDATORY and runs twice
  let processed = bulletproofMergeBullets(rawFeedback);
  
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

  // Final bulletproof pass to catch anything from the cleanup
  processed = bulletproofMergeBullets(processed);

  // Validate the result and log any issues
  const validation = validateFeedbackFormat(processed);
  if (!validation.isValid) {
    console.error('🚨 CRITICAL: Orphaned bullets still detected after processing!', validation.issues);
  }

  return processed.trim();
}
