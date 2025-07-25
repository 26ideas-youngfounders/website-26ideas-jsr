
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  AutosaveFormData, 
  AutosaveStatus,
  isAutosaveFormData,
  validateAndSetStatus 
} from '@/types/autosave';

interface UseAutosaveProps {
  formData: any;
  debounceMs?: number;
  formType?: string;
}

/**
 * Enhanced autosave hook with auto-resume and persistent draft management
 */
export const useAutosave = ({ formData, debounceMs = 2000, formType = 'yff_team_registration' }: UseAutosaveProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [conflictCount, setConflictCount] = useState(0);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  // Type-safe status setter
  const setStatusSafe = useCallback((newStatus: AutosaveStatus) => {
    if (validateAndSetStatus(newStatus, setStatus)) {
      console.log('💾 [AUTOSAVE] Status changed:', newStatus);
    }
  }, []);

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
    
    // Store critical events for debugging
    if (message.includes('ERROR') || message.includes('CONFLICT') || message.includes('RESUME')) {
      const errorLog = JSON.parse(localStorage.getItem('yff_autosave_events') || '[]');
      errorLog.push(logEntry);
      localStorage.setItem('yff_autosave_events', JSON.stringify(errorLog.slice(-20)));
    }
  };

  // Enhanced load function with auto-resume capability
  const loadSavedData = useCallback(async (): Promise<AutosaveFormData | null> => {
    if (!user?.id) {
      logAutosave('No user ID available for draft loading');
      return null;
    }

    if (hasLoadedDraft) {
      logAutosave('Draft already loaded, skipping reload');
      return null;
    }

    try {
      setStatusSafe('loading');
      logAutosave('Loading saved draft for auto-resume...', { userId: user.id });
      
      const { data, error } = await supabase
        .from('yff_team_registration_autosave')
        .select('form_data, updated_at, id')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logAutosave('ERROR loading draft', error);
        setStatusSafe('error');
        return null;
      }

      if (data && data.form_data) {
        logAutosave('RESUME: Draft found and loaded successfully', { 
          lastUpdated: data.updated_at,
          recordId: data.id,
          dataKeys: Object.keys(data.form_data)
        });
        
        if (isAutosaveFormData(data.form_data)) {
          setLastSaved(new Date(data.updated_at));
          setHasLoadedDraft(true);
          setStatusSafe('saved');
          return data.form_data as AutosaveFormData;
        } else {
          logAutosave('Invalid draft data structure detected');
          setStatusSafe('error');
          return null;
        }
      }

      logAutosave('RESUME: No draft found for user');
      setStatusSafe('idle');
      return null;
    } catch (error) {
      logAutosave('ERROR in loadSavedData', error);
      setStatusSafe('error');
      return null;
    }
  }, [user?.id, formType, setStatusSafe, hasLoadedDraft]);

  // Enhanced save with better conflict detection
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

    setStatusSafe('saving');
    setSaveAttempts(prev => prev + 1);
    
    try {
      logAutosave('Saving draft for auto-resume...', { 
        attempt: saveAttempts + 1,
        userId: user.id,
        dataKeys: Object.keys(data),
        formType
      });

      // Check for existing completed registration to prevent conflicts
      if (formType === 'yff_team_registration') {
        const { data: existingReg, error: regError } = await supabase
          .from('yff_team_registrations')
          .select('id, application_status')
          .eq('individual_id', user.id)
          .maybeSingle();

        if (regError && regError.code !== 'PGRST116') {
          logAutosave('ERROR checking existing registration', regError);
          setStatusSafe('error');
          return;
        }

        if (existingReg) {
          logAutosave('Registration already exists - stopping autosave to prevent conflicts');
          setStatusSafe('conflict');
          setConflictCount(prev => prev + 1);
          return;
        }
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
        logAutosave('ERROR saving draft', error);
        setStatusSafe('error');
        
        // Exponential backoff for retries
        const retryDelay = Math.min(1000 * Math.pow(2, saveAttempts), 30000);
        setTimeout(() => setStatusSafe('idle'), retryDelay);
      } else {
        logAutosave('Draft saved successfully for auto-resume', { 
          userId: user.id,
          dataSize: JSON.stringify(data).length 
        });
        setStatusSafe('saved');
        setLastSaved(new Date());
        setSaveAttempts(0);
        
        setTimeout(() => setStatusSafe('idle'), 2000);
      }
    } catch (error) {
      logAutosave('ERROR in saveData', error);
      setStatusSafe('error');
      setTimeout(() => setStatusSafe('idle'), 3000);
    }
  }, [user?.id, isInitialLoad, saveAttempts, setStatusSafe, formType]);

  // Enhanced clear function
  const clearSavedData = useCallback(async () => {
    if (!user?.id) return;

    try {
      logAutosave('Clearing saved draft...', { userId: user.id });
      
      const { error } = await supabase
        .from('yff_team_registration_autosave')
        .delete()
        .eq('individual_id', user.id);
        
      if (error) {
        logAutosave('ERROR clearing draft', error);
      } else {
        logAutosave('Draft cleared successfully');
        setLastSaved(null);
        setHasLoadedDraft(false);
        setStatusSafe('idle');
        setSaveAttempts(0);
        setConflictCount(0);
      }
    } catch (error) {
      logAutosave('ERROR in clearSavedData', error);
    }
  }, [user?.id, setStatusSafe]);

  // Auto-resume on user login
  useEffect(() => {
    if (user?.id && !hasLoadedDraft) {
      logAutosave('User authenticated - attempting auto-resume');
      const timer = setTimeout(() => {
        loadSavedData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, hasLoadedDraft, loadSavedData]);

  // Debounced save
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
      setHasLoadedDraft(false);
      logAutosave('User changed - resetting autosave state', { userId: user.id });
    }
  }, [user?.id]);

  return {
    status,
    lastSaved,
    loadSavedData,
    clearSavedData,
    isLoading: status === 'loading',
    saveAttempts,
    conflictCount,
    hasLoadedDraft,
  };
};
