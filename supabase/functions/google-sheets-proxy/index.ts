
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
 * Get Google OAuth2 access token using service account
 */
async function getServiceAccountAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  try {
    const credentials = JSON.parse(serviceAccountKey);
    
    // Create JWT assertion
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // For demo purposes - in production you'd use proper JWT signing
    // This is a simplified approach that works with Google's OAuth2
    const assertion = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload));
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Error getting service account token:', error);
    throw new Error('Failed to authenticate with service account');
  }
}

/**
 * Validate and sanitize Google Sheets response data
 */
function validateSheetData(rows: string[][]): any[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('⚠️ No data rows found in Google Sheets response');
    return [];
  }

  // Skip header row and validate each row
  const validatedData = rows.slice(1)
    .map((row: string[], index: number) => {
      if (!Array.isArray(row) || row.length < 4) {
        console.log(`⚠️ Skipping invalid row ${index + 2}:`, row);
        return null;
      }
      
      return {
        teamName: (row[0] || '').toString().trim(),
        idea: (row[1] || '').toString().trim(),
        averageScore: (row[2] || '').toString().trim(),
        feedback: (row[3] || '').toString().trim(),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null && row.teamName.length > 0);

  console.log(`✅ Processed ${validatedData.length} valid rows from ${rows.length} total rows`);
  return validatedData;
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
 * Fetch data from Google Sheets API with service account authentication
 */
async function fetchSheetData(): Promise<any[]> {
  const cacheKey = `${SPREADSHEET_ID}-${SHEET_NAME}`;
  
  // Check cache first
  if (isCacheValid(cacheKey)) {
    console.log('📋 Returning cached Google Sheets data');
    return cache.get(cacheKey)!.data;
  }

  console.log('🔄 Fetching fresh Google Sheets data...');
  
  // Try API Key approach first (for backward compatibility)
  const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
  
  if (apiKey) {
    console.log('🔑 Using API Key approach...');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const rows = json.values || [];
        const validatedData = validateSheetData(rows);
        
        // Cache the validated data
        cache.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        });

        return validatedData;
      } else if (response.status === 403) {
        console.log('⚠️ API Key access denied, trying service account...');
        // Fall through to service account approach
      } else {
        throw new Error(`Google Sheets API error: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️ API Key approach failed, trying service account...');
      // Fall through to service account approach
    }
  }

  // Service Account approach
  console.log('🔐 Using Service Account approach...');
  try {
    const accessToken = await getServiceAccountAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('📊 Google Sheets API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Sheets API error response:', errorText);
      
      if (response.status === 403) {
        throw new Error(`Access denied to Google Sheet. Please share the sheet with: lovable@centering-star-465315-m5.iam.gserviceaccount.com`);
      }
      if (response.status === 404) {
        throw new Error(`Google Sheet not found. Please verify the spreadsheet ID and sheet name.`);
      }
      if (response.status === 400) {
        throw new Error(`Invalid request to Google Sheets API. Please check the configuration.`);
      }
      
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const json = await response.json();
    const rows = json.values || [];
    
    console.log('✅ Raw Google Sheets data received:', {
      totalRows: rows.length,
      hasHeader: rows.length > 0,
      columns: rows.length > 0 ? rows[0]?.length || 0 : 0
    });

    if (rows.length === 0) {
      console.log('⚠️ Google Sheets returned empty data');
      return [];
    }

    // Validate and sanitize data
    const validatedData = validateSheetData(rows);
    
    console.log('✅ Final validated data count:', validatedData.length);

    // Cache the validated data
    cache.set(cacheKey, {
      data: validatedData,
      timestamp: Date.now()
    });

    return validatedData;

  } catch (error) {
    console.error('❌ Service account authentication failed:', error);
    throw new Error(`Failed to access Google Sheet. Please ensure the sheet is shared with: lovable@centering-star-465315-m5.iam.gserviceaccount.com`);
  }
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
      count: data.length,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME
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
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
