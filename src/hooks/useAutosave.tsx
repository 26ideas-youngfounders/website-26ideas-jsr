
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'loading';

interface UseAutosaveProps {
  formData: any;
  debounceMs?: number;
  formType?: string; // Add form type to distinguish between different forms
}

/**
 * Custom hook for autosaving form data with cross-session persistence
 * Handles automatic saving of form state to prevent data loss across login/logout
 */
export const useAutosave = ({ formData, debounceMs = 2000, formType = 'yff_team_registration' }: UseAutosaveProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load saved data on component mount or user change
  const loadSavedData = useCallback(async () => {
    if (!user?.id) {
      console.log('🔄 No user ID available for autosave load');
      return null;
    }

    try {
      setStatus('loading');
      console.log('📁 Loading autosave data for user:', user.id);
      
      const { data, error } = await supabase
        .from('yff_team_registration_autosave')
        .select('form_data, updated_at')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading autosave data:', error);
        setStatus('error');
        return null;
      }

      if (data) {
        console.log('✅ Loaded autosave data from:', data.updated_at);
        setLastSaved(new Date(data.updated_at));
        setStatus('saved');
        return data.form_data;
      }

      console.log('📭 No autosave data found');
      setStatus('idle');
      return null;
    } catch (error) {
      console.error('❌ Error loading autosave data:', error);
      setStatus('error');
      return null;
    }
  }, [user?.id]);

  // Save data to database using upsert
  const saveData = useCallback(async (data: any) => {
    if (!user?.id) {
      console.log('🔄 No user ID available for autosave');
      return;
    }

    // Skip saving if this is the initial load to prevent overwriting with default values
    if (isInitialLoad) {
      console.log('🔄 Skipping autosave during initial load');
      return;
    }

    // Don't save if data is mostly empty (just default values)
    const hasSignificantData = Object.values(data).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return value > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    });

    if (!hasSignificantData) {
      console.log('🔄 Skipping autosave - no significant data to save');
      return;
    }

    setStatus('saving');
    
    try {
      console.log('💾 Autosaving data for user:', user.id);
      
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
        console.error('❌ Autosave failed:', error);
        setStatus('error');
        
        // Show error message to user but don't block form usage
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        console.log('✅ Autosave successful');
        setStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after showing success
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('❌ Autosave error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [user?.id, isInitialLoad]);

  // Clear saved data (called after successful submission)
  const clearSavedData = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('yff_team_registration_autosave')
        .delete()
        .eq('individual_id', user.id);
      
      console.log('🗑️ Cleared autosave data');
      setLastSaved(null);
      setStatus('idle');
    } catch (error) {
      console.error('❌ Error clearing autosave data:', error);
    }
  }, [user?.id]);

  // Debounced save effect
  useEffect(() => {
    if (!formData || !user?.id) return;

    const timeoutId = setTimeout(() => {
      saveData(formData);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, user?.id, debounceMs, saveData]);

  // Mark initial load as complete after first render
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Reset initial load flag when user changes
  useEffect(() => {
    if (user?.id) {
      setIsInitialLoad(true);
    }
  }, [user?.id]);

  return {
    status,
    lastSaved,
    loadSavedData,
    clearSavedData,
    isLoading: status === 'loading',
  };
};
