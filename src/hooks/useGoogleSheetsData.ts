
import { useState, useEffect, useCallback } from 'react';

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

const SPREADSHEET_ID = '1N4rNJDtW2NHl0K38oiIrGag-VwXbvaUkgPri-QE4XnM';
const SHEET_NAME = 'Answers';
const API_KEY = 'AIzaSyAQqgzd1oYW603wThb_iWnrQ9F1slwo-2g';
const POLLING_INTERVAL = 180000; // 3 minutes

/**
 * Custom hook to fetch and sync Google Sheets data with periodic polling
 */
export const useGoogleSheetsData = (): UseGoogleSheetsDataReturn => {
  const [data, setData] = useState<GoogleSheetsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch data from Google Sheets API
   */
  const fetchSheetData = useCallback(async () => {
    try {
      console.log('📊 Fetching Google Sheets data...');
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const rows = json.values || [];
      
      console.log('✅ Raw Google Sheets data:', rows);

      // Skip header row and parse data
      const parsedData: GoogleSheetsRow[] = rows.slice(1).map((row: string[]) => ({
        teamName: (row[0] || '').trim(),
        idea: (row[1] || '').trim(),
        averageScore: (row[2] || '').trim(),
        feedback: (row[3] || '').trim(),
      })).filter((row: GoogleSheetsRow) => row.teamName); // Filter out empty rows

      console.log('✅ Parsed Google Sheets data:', parsedData.length, 'rows');
      setData(parsedData);
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
    console.log('🔄 Setting up Google Sheets polling every 3 minutes...');
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
