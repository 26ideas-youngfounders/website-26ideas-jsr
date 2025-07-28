
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 180000; // 3 minutes in milliseconds
const SPREADSHEET_ID = '1N4rNJDtW2NHl0K38oiIrGag-VwXbvaUkgPri-QE4XnM';
const SHEET_NAME = 'Answers';

/**
 * Validate and sanitize Google Sheets response data
 */
function validateSheetData(rows: string[][]): any[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // Skip header row and validate each row
  return rows.slice(1)
    .map((row: string[]) => ({
      teamName: (row[0] || '').toString().trim(),
      idea: (row[1] || '').toString().trim(),
      averageScore: (row[2] || '').toString().trim(),
      feedback: (row[3] || '').toString().trim(),
    }))
    .filter((row) => row.teamName && row.teamName.length > 0); // Only include rows with team names
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheKey: string): boolean {
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < CACHE_TTL;
}

/**
 * Fetch data from Google Sheets API with caching
 */
async function fetchSheetData(): Promise<any[]> {
  const cacheKey = `${SPREADSHEET_ID}-${SHEET_NAME}`;
  
  // Check cache first
  if (isCacheValid(cacheKey)) {
    console.log('📋 Returning cached Google Sheets data');
    return cache.get(cacheKey)!.data;
  }

  console.log('🔄 Fetching fresh Google Sheets data...');
  
  const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
  if (!apiKey) {
    throw new Error('Google Sheets API key not configured');
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${apiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google Sheets API error:', response.status, errorText);
    
    if (response.status === 403) {
      throw new Error('Access denied to Google Sheet. Please ensure the sheet is shared with the correct permissions.');
    }
    if (response.status === 404) {
      throw new Error('Google Sheet not found. Please check the spreadsheet ID and sheet name.');
    }
    
    throw new Error(`Google Sheets API error: ${response.status}`);
  }

  const json = await response.json();
  const rows = json.values || [];
  
  console.log('✅ Raw Google Sheets data received:', rows.length, 'rows');

  // Validate and sanitize data
  const validatedData = validateSheetData(rows);
  
  console.log('✅ Validated Google Sheets data:', validatedData.length, 'valid rows');

  // Cache the validated data
  cache.set(cacheKey, {
    data: validatedData,
    timestamp: Date.now()
  });

  return validatedData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add basic rate limiting check (optional)
    const userAgent = req.headers.get('user-agent') || 'unknown';
    console.log('📊 Google Sheets proxy request from:', userAgent);

    const data = await fetchSheetData();

    return new Response(JSON.stringify({
      success: true,
      data,
      cached: isCacheValid(`${SPREADSHEET_ID}-${SHEET_NAME}`),
      timestamp: new Date().toISOString(),
      count: data.length
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=180' // 3 minutes browser cache
      },
    });

  } catch (error) {
    console.error('❌ Error in google-sheets-proxy function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
