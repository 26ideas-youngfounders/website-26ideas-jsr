
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AutosaveFormData, isAutosaveFormData } from '@/types/autosave';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'loading' | 'conflict';

interface UseAutosaveProps {
  formData: any;
  debounceMs?: number;
  formType?: string;
}

/**
 * Enhanced autosave hook with conflict prevention and detailed logging
 */
export const useAutosave = ({ formData, debounceMs = 2000, formType = 'yff_team_registration' }: UseAutosaveProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [conflictCount, setConflictCount] = useState(0);
  const [saveAttempts, setSaveAttempts] = useState(0);

  // Enhanced logging with detailed context
  const logAutosave = (message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      formType,
      status,
      message,
      data
    };
    console.log('💾 [AUTOSAVE]', logEntry);
    
    // Store critical events in localStorage for debugging
    if (message.includes('ERROR') || message.includes('CONFLICT')) {
      const errorLog = JSON.parse(localStorage.getItem('yff_autosave_errors') || '[]');
      errorLog.push(logEntry);
      localStorage.setItem('yff_autosave_errors', JSON.stringify(errorLog.slice(-10))); // Keep last 10 errors
    }
  };

  // Load saved data with conflict detection
  const loadSavedData = useCallback(async (): Promise<AutosaveFormData | null> => {
    if (!user?.id) {
      logAutosave('No user ID available for autosave load');
      return null;
    }

    try {
      setStatus('loading');
      logAutosave('Loading autosave data...', { userId: user.id });
      
      const { data, error } = await supabase
        .from('yff_team_registration_autosave')
        .select('form_data, updated_at, id')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logAutosave('ERROR loading autosave data', error);
        setStatus('error');
        return null;
      }

      if (data && data.form_data) {
        logAutosave('Loaded autosave data successfully', { 
          lastUpdated: data.updated_at,
          recordId: data.id 
        });
        
        if (isAutosaveFormData(data.form_data)) {
          setLastSaved(new Date(data.updated_at));
          setStatus('saved');
          return data.form_data as AutosaveFormData;
        } else {
          logAutosave('Invalid autosave data structure detected');
          setStatus('error');
          return null;
        }
      }

      logAutosave('No autosave data found');
      setStatus('idle');
      return null;
    } catch (error) {
      logAutosave('ERROR in loadSavedData', error);
      setStatus('error');
      return null;
    }
  }, [user?.id, formType]);

  // Enhanced save with conflict prevention
  const saveData = useCallback(async (data: any) => {
    if (!user?.id) {
      logAutosave('No user ID available for autosave');
      return;
    }

    if (isInitialLoad) {
      logAutosave('Skipping autosave during initial load');
      return;
    }

    // Check if data has significant content
    const hasSignificantData = Object.values(data).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return value > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    });

    if (!hasSignificantData) {
      logAutosave('Skipping autosave - no significant data');
      return;
    }

    setStatus('saving');
    setSaveAttempts(prev => prev + 1);
    
    try {
      logAutosave('Attempting to save autosave data...', { 
        attempt: saveAttempts + 1,
        userId: user.id,
        dataKeys: Object.keys(data)
      });

      // Check for existing registration to prevent conflicts
      const { data: existingReg, error: regError } = await supabase
        .from('yff_team_registrations')
        .select('id')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (regError && regError.code !== 'PGRST116') {
        logAutosave('ERROR checking existing registration', regError);
        setStatus('error');
        return;
      }

      if (existingReg) {
        logAutosave('Registration already exists - stopping autosave');
        setStatus('conflict');
        setConflictCount(prev => prev + 1);
        return;
      }
      
      const { error } = await supabase
        .from('yff_team_registration_autosave')
        .upsert({
          individual_id: user.id,
          form_data: data,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'individual_id'
        });

      if (error) {
        logAutosave('ERROR saving autosave data', error);
        setStatus('error');
        
        // Exponential backoff for retries
        const retryDelay = Math.min(1000 * Math.pow(2, saveAttempts), 30000);
        setTimeout(() => setStatus('idle'), retryDelay);
      } else {
        logAutosave('Autosave successful', { 
          userId: user.id,
          dataSize: JSON.stringify(data).length 
        });
        setStatus('saved');
        setLastSaved(new Date());
        setSaveAttempts(0);
        
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (error) {
      logAutosave('ERROR in saveData', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [user?.id, isInitialLoad, saveAttempts]);

  // Enhanced clear function with logging
  const clearSavedData = useCallback(async () => {
    if (!user?.id) return;

    try {
      logAutosave('Clearing autosave data...', { userId: user.id });
      
      const { error } = await supabase
        .from('yff_team_registration_autosave')
        .delete()
        .eq('individual_id', user.id);
        
      if (error) {
        logAutosave('ERROR clearing autosave data', error);
      } else {
        logAutosave('Autosave data cleared successfully');
        setLastSaved(null);
        setStatus('idle');
        setSaveAttempts(0);
        setConflictCount(0);
      }
    } catch (error) {
      logAutosave('ERROR in clearSavedData', error);
    }
  }, [user?.id]);

  // Debounced save with conflict checking
  useEffect(() => {
    if (!formData || !user?.id || status === 'conflict') return;

    const timeoutId = setTimeout(() => {
      saveData(formData);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, user?.id, debounceMs, saveData, status]);

  // Initial load management
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        logAutosave('Initial load phase completed');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Reset on user change
  useEffect(() => {
    if (user?.id) {
      setIsInitialLoad(true);
      setSaveAttempts(0);
      setConflictCount(0);
      logAutosave('User changed - resetting autosave state', { userId: user.id });
    }
  }, [user?.id]);

  // Monitor for excessive conflicts
  useEffect(() => {
    if (conflictCount > 3) {
      logAutosave('EXCESSIVE CONFLICTS detected - possible registration exists', {
        conflictCount,
        userId: user?.id
      });
    }
  }, [conflictCount, user?.id]);

  return {
    status,
    lastSaved,
    loadSavedData,
    clearSavedData,
    isLoading: status === 'loading',
    saveAttempts,
    conflictCount,
  };
};
