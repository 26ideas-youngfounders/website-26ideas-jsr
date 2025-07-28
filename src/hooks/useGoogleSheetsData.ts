
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleSheetsRow {
  teamName: string;
  idea: string;
  averageScore: string;
  feedback: string;
}

interface UseGoogleSheetsDataReturn {
  data: GoogleSheetsRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const POLLING_INTERVAL = 180000; // 3 minutes

/**
 * Custom hook to fetch and sync Google Sheets data via Supabase Edge Function
 */
export const useGoogleSheetsData = (): UseGoogleSheetsDataReturn => {
  const [data, setData] = useState<GoogleSheetsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch data from Google Sheets via secure Edge Function
   */
  const fetchSheetData = useCallback(async () => {
    try {
      console.log('📊 Fetching Google Sheets data via Edge Function...');
      
      const { data: response, error: functionError } = await supabase.functions.invoke('google-sheets-proxy', {
        method: 'GET',
      });

      if (functionError) {
        throw new Error(`Edge Function error: ${functionError.message}`);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Google Sheets data');
      }

      const sheetsData = response.data || [];
      
      console.log('✅ Google Sheets data received via Edge Function:', {
        count: sheetsData.length,
        cached: response.cached,
        timestamp: response.timestamp
      });

      setData(sheetsData);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching Google Sheets data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Google Sheets data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set up periodic polling and initial data fetch
   */
  useEffect(() => {
    // Initial fetch
    fetchSheetData();

    // Set up polling interval
    console.log('🔄 Setting up Google Sheets polling every 3 minutes via Edge Function...');
    const interval = setInterval(fetchSheetData, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      console.log('🔚 Cleaning up Google Sheets polling...');
      clearInterval(interval);
    };
  }, [fetchSheetData]);

  return {
    data,
    loading,
    error,
    refetch: fetchSheetData
  };
};
