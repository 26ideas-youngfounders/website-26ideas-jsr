
/**
 * Debug utility for YFF registration system
 * Provides tools for testing and debugging edge cases
 */

import { supabase } from '@/integrations/supabase/client';

export interface DebugSession {
  startTime: Date;
  userId: string;
  email: string;
  events: DebugEvent[];
}

export interface DebugEvent {
  timestamp: Date;
  type: 'form_input' | 'validation' | 'autosave' | 'submission' | 'error';
  data: any;
  message: string;
}

class YffDebugHelper {
  private session: DebugSession | null = null;
  private isDebugging = false;

  /**
   * Start a debug session
   */
  startDebugSession(userId: string, email: string): void {
    this.session = {
      startTime: new Date(),
      userId,
      email,
      events: []
    };
    this.isDebugging = true;
    console.log('🐛 [DEBUG] Started YFF debug session', this.session);
  }

  /**
   * Log a debug event
   */
  logEvent(type: DebugEvent['type'], message: string, data?: any): void {
    if (!this.isDebugging || !this.session) return;

    const event: DebugEvent = {
      timestamp: new Date(),
      type,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };

    this.session.events.push(event);
    console.log('🐛 [DEBUG]', event);

    // Store in localStorage for persistence
    localStorage.setItem('yff_debug_session', JSON.stringify(this.session));
  }

  /**
   * End debug session and generate report
   */
  endDebugSession(): DebugSession | null {
    if (!this.session) return null;

    const report = { ...this.session };
    console.log('🐛 [DEBUG] Session ended', report);
    
    this.session = null;
    this.isDebugging = false;
    
    return report;
  }

  /**
   * Test duplicate registration prevention
   */
  async testDuplicateRegistration(userId: string, email: string): Promise<boolean> {
    this.logEvent('validation', 'Testing duplicate registration prevention', { userId, email });
    
    try {
      // Check existing registration
      const { data: existing, error } = await supabase
        .from('yff_team_registrations')
        .select('id, individual_id, email')
        .or(`individual_id.eq.${userId},email.eq.${email}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        this.logEvent('error', 'Error checking existing registration', error);
        return false;
      }

      const hasDuplicate = !!existing;
      this.logEvent('validation', 'Duplicate check result', { hasDuplicate, existing });
      
      return hasDuplicate;
    } catch (error) {
      this.logEvent('error', 'Exception in duplicate test', error);
      return false;
    }
  }

  /**
   * Test form validation
   */
  testFormValidation(formData: any): { isValid: boolean; errors: string[] } {
    this.logEvent('validation', 'Testing form validation', formData);
    
    const errors: string[] = [];
    
    // Required field validation
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'dateOfBirth'];
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (formData.phoneNumber && formData.phoneNumber.length < 8) {
      errors.push('Phone number must be at least 8 digits');
    }

    const result = { isValid: errors.length === 0, errors };
    this.logEvent('validation', 'Validation result', result);
    
    return result;
  }

  /**
   * Test autosave functionality
   */
  async testAutosave(userId: string, formData: any): Promise<boolean> {
    this.logEvent('autosave', 'Testing autosave functionality', { userId, formData });
    
    try {
      // Simulate autosave
      const { error } = await supabase
        .from('yff_team_registration_autosave')
        .upsert({
          individual_id: userId,
          form_data: formData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'individual_id'
        });

      if (error) {
        this.logEvent('error', 'Autosave failed', error);
        return false;
      }

      this.logEvent('autosave', 'Autosave successful', { userId });
      return true;
    } catch (error) {
      this.logEvent('error', 'Exception in autosave test', error);
      return false;
    }
  }

  /**
   * Run comprehensive edge case tests
   */
  async runEdgeCaseTests(userId: string, email: string): Promise<void> {
    this.startDebugSession(userId, email);
    
    console.log('🧪 Running comprehensive edge case tests...');
    
    // Test 1: Duplicate registration
    await this.testDuplicateRegistration(userId, email);
    
    // Test 2: Form validation with empty data
    this.testFormValidation({});
    
    // Test 3: Form validation with invalid data
    this.testFormValidation({
      fullName: '',
      email: 'invalid-email',
      phoneNumber: '123',
      dateOfBirth: ''
    });
    
    // Test 4: Form validation with valid data
    this.testFormValidation({
      fullName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      dateOfBirth: '1990-01-01'
    });
    
    // Test 5: Autosave with valid data
    await this.testAutosave(userId, {
      fullName: 'John Doe',
      email: 'john@example.com',
      progress: 'partial'
    });
    
    // Test 6: Unicode handling
    this.testFormValidation({
      fullName: 'João Silva 👨‍💻',
      email: 'joão@example.com',
      phoneNumber: '1234567890',
      dateOfBirth: '1990-01-01'
    });
    
    // Test 7: Very long strings
    this.testFormValidation({
      fullName: 'A'.repeat(300),
      email: 'test@example.com',
      phoneNumber: '1234567890',
      dateOfBirth: '1990-01-01'
    });
    
    const report = this.endDebugSession();
    console.log('🧪 Edge case tests completed:', report);
  }

  /**
   * Generate debugging report
   */
  generateReport(): string {
    const session = this.session || JSON.parse(localStorage.getItem('yff_debug_session') || 'null');
    
    if (!session) return 'No debug session found';
    
    const report = [
      '=== YFF Registration Debug Report ===',
      `Session: ${session.startTime} - ${session.userId}`,
      `Email: ${session.email}`,
      `Events: ${session.events.length}`,
      '',
      '=== Events ===',
      ...session.events.map(event => 
        `${event.timestamp.toISOString()} [${event.type}] ${event.message}`
      ),
      '',
      '=== Summary ===',
      `Total events: ${session.events.length}`,
      `Errors: ${session.events.filter(e => e.type === 'error').length}`,
      `Validations: ${session.events.filter(e => e.type === 'validation').length}`,
      `Autosaves: ${session.events.filter(e => e.type === 'autosave').length}`,
      `Submissions: ${session.events.filter(e => e.type === 'submission').length}`,
    ];
    
    return report.join('\n');
  }
}

export const yffDebugHelper = new YffDebugHelper();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).yffDebug = yffDebugHelper;
}
