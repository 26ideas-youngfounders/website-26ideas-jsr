
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveProps {
  formData: any;
  debounceMs?: number;
}

/**
 * Custom hook for autosaving form data
 * Handles automatic saving of form state to prevent data loss
 */
export const useAutosave = ({ formData, debounceMs = 1000 }: UseAutosaveProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved data on component mount
  const loadSavedData = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('yff_team_registration_autosave')
        .select('form_data')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading autosave data:', error);
        return null;
      }

      if (data) {
        console.log('📁 Loaded autosave data:', data.form_data);
        return data.form_data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error loading autosave data:', error);
      return null;
    }
  }, [user]);

  // Save data to database using upsert with unique constraint
  const saveData = useCallback(async (data: any) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      // Use upsert to handle insert/update automatically
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
      } else {
        console.log('✅ Autosave successful');
        setStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('❌ Autosave error:', error);
      setStatus('error');
    }
  }, [user]);

  // Clear saved data (called after successful submission)
  const clearSavedData = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('yff_team_registration_autosave')
        .delete()
        .eq('individual_id', user.id);
      
      console.log('🗑️ Cleared autosave data');
    } catch (error) {
      console.error('❌ Error clearing autosave data:', error);
    }
  }, [user]);

  // Debounced save effect
  useEffect(() => {
    if (!formData || !user) return;

    const timeoutId = setTimeout(() => {
      saveData(formData);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, user, debounceMs, saveData]);

  return {
    status,
    lastSaved,
    loadSavedData,
    clearSavedData,
  };
};
