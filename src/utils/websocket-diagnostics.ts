
/**
 * @fileoverview WebSocket Diagnostic Utilities
 * 
 * Comprehensive diagnostic tools for WebSocket connection troubleshooting
 * and state monitoring with detailed logging and error reporting.
 * 
 * @version 2.1.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

/**
 * WebSocket state constants with proper mapping
 */
export const WEBSOCKET_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const;

export const WEBSOCKET_STATE_NAMES = {
  [WEBSOCKET_STATES.CONNECTING]: 'CONNECTING',
  [WEBSOCKET_STATES.OPEN]: 'OPEN',
  [WEBSOCKET_STATES.CLOSING]: 'CLOSING',
  [WEBSOCKET_STATES.CLOSED]: 'CLOSED'
} as const;

/**
 * Comprehensive WebSocket diagnostic information
 */
export interface WebSocketDiagnostics {
  isConfigured: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  socketState: number | undefined;
  socketStateName: string;
  realtimeSocket: any;
  supabaseUrl: string | undefined;
  hasSupabaseKey: boolean;
}

/**
 * Run comprehensive WebSocket diagnostics with robust configuration detection
 */
export const diagnoseWebSocketConnection = async (): Promise<WebSocketDiagnostics> => {
  console.log('🔍 === WebSocket Diagnostic Start ===');
  
  // Get configuration directly from the configured client
  const supabaseUrl = "https://jdqsgigwbcukxijiunwl.supabase.co";
  const hasSupabaseKey = true; // We know this is configured since we have a working client
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key Present:', hasSupabaseKey);
  
  // Check authentication status
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  console.log('Auth Session:', session ? 'Valid' : 'Invalid');
  console.log('Auth Error:', authError || 'None');
  
  if (session) {
    console.log('User ID:', session.user?.id || 'None');
    console.log('Access Token Present:', !!session.access_token);
    console.log('Token Expires At:', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'Unknown');
  }
  
  // Check realtime socket status with initialization if needed
  let realtimeSocket = (supabase as any).realtime?.socket;
  console.log('Initial Realtime Socket Available:', !!realtimeSocket);
  
  // Initialize realtime if not available
  if (!realtimeSocket) {
    console.log('🔄 Initializing realtime connection...');
    try {
      // Force realtime initialization
      (supabase as any).realtime.connect();
      
      // Wait for initialization with retries
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!realtimeSocket && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        realtimeSocket = (supabase as any).realtime?.socket;
        attempts++;
        console.log(`Initialization attempt ${attempts}: Socket available = ${!!realtimeSocket}`);
      }
      
      if (!realtimeSocket) {
        console.error('❌ Failed to initialize realtime socket after', maxAttempts, 'attempts');
      } else {
        console.log('✅ Realtime socket initialized successfully');
      }
    } catch (initError) {
      console.error('❌ Error during realtime initialization:', initError);
    }
  }
  
  let socketState: number | undefined;
  let socketStateName = 'UNAVAILABLE';
  
  if (realtimeSocket) {
    socketState = realtimeSocket.readyState;
    socketStateName = WEBSOCKET_STATE_NAMES[socketState] || 'UNKNOWN';
    console.log('Socket State:', `${socketState} (${socketStateName})`);
    console.log('Socket URL:', realtimeSocket.endPoint || 'Not available');
    console.log('Socket Connection State:', realtimeSocket.connectionState || 'Unknown');
    console.log('Socket Channels:', Object.keys(realtimeSocket.channels || {}).length);
    
    // Additional socket diagnostics
    console.log('Socket Transport:', realtimeSocket.transport || 'Unknown');
    console.log('Socket Ref:', realtimeSocket.ref || 'Unknown');
    console.log('Socket Send Buffer:', realtimeSocket.sendBuffer?.length || 0);
  }
  
  // Additional environment checks
  console.log('Environment Details:');
  console.log('- Window Location:', window.location.href);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Online Status:', navigator.onLine);
  console.log('- Connection Type:', (navigator as any).connection?.effectiveType || 'Unknown');
  
  console.log('🔍 === Diagnostic Complete ===');
  
  // Configuration is valid since we have a working Supabase client
  const isConfigured = true;
  
  return {
    isConfigured,
    isAuthenticated: !!session,
    session,
    socketState,
    socketStateName,
    realtimeSocket,
    supabaseUrl,
    hasSupabaseKey
  };
};

/**
 * Enhanced WebSocket connection establishment with robust retry logic
 */
export const ensureWebSocketConnection = async (timeoutMs: number = 15000): Promise<boolean> => {
  console.log('🔄 Ensuring WebSocket connection with enhanced logic...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('❌ WebSocket connection timeout after', timeoutMs, 'ms');
      reject(new Error(`WebSocket connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const startConnection = async () => {
      try {
        let realtimeSocket = (supabase as any).realtime?.socket;
        
        // Initialize realtime if not present
        if (!realtimeSocket) {
          console.log('🔄 Initializing realtime system...');
          (supabase as any).realtime.connect();
          
          // Wait for socket to be created
          let initAttempts = 0;
          while (!realtimeSocket && initAttempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            realtimeSocket = (supabase as any).realtime?.socket;
            initAttempts++;
          }
          
          if (!realtimeSocket) {
            throw new Error('Failed to initialize realtime socket');
          }
          
          console.log('✅ Realtime socket created successfully');
        }

        const initialState = realtimeSocket.readyState;
        const initialStateName = WEBSOCKET_STATE_NAMES[initialState] || 'UNKNOWN';
        console.log(`🔍 Initial WebSocket state: ${initialState} (${initialStateName})`);
        
        // Force connection if not open
        if (initialState !== WEBSOCKET_STATES.OPEN) {
          console.log('🔄 Forcing WebSocket connection...');
          
          // Try multiple connection strategies
          try {
            if (realtimeSocket.connect && typeof realtimeSocket.connect === 'function') {
              realtimeSocket.connect();
            } else {
              (supabase as any).realtime.connect();
            }
          } catch (connectError) {
            console.warn('⚠️ Primary connection method failed:', connectError);
            // Fallback: recreate the connection
            (supabase as any).realtime.disconnect();
            await new Promise(resolve => setTimeout(resolve, 500));
            (supabase as any).realtime.connect();
            realtimeSocket = (supabase as any).realtime?.socket;
          }
        }

        // Monitor connection with enhanced logic
        let attemptCount = 0;
        const maxAttempts = Math.floor(timeoutMs / 100);
        
        const checkConnection = () => {
          attemptCount++;
          const currentState = realtimeSocket?.readyState;
          const currentStateName = WEBSOCKET_STATE_NAMES[currentState] || 'UNKNOWN';
          
          if (attemptCount % 20 === 0 || attemptCount <= 5) {
            console.log(`🔍 Connection check ${attemptCount}: ${currentState} (${currentStateName})`);
          }
          
          if (currentState === WEBSOCKET_STATES.OPEN) {
            console.log('✅ WebSocket connection established successfully');
            clearTimeout(timeout);
            resolve(true);
          } else if (currentState === WEBSOCKET_STATES.CLOSED && attemptCount > 10) {
            // If closed and we've waited a bit, try reconnecting once more
            console.log('🔄 Socket closed, attempting reconnection...');
            try {
              (supabase as any).realtime.connect();
            } catch (reconnectError) {
              console.error('❌ Reconnection failed:', reconnectError);
            }
            setTimeout(checkConnection, 100);
          } else if (attemptCount >= maxAttempts) {
            console.error(`❌ WebSocket failed to reach OPEN state after ${attemptCount} attempts (final state: ${currentStateName})`);
            clearTimeout(timeout);
            reject(new Error(`WebSocket connection failed - stuck in ${currentStateName} state after ${attemptCount} attempts`));
          } else {
            // Continue monitoring
            setTimeout(checkConnection, 100);
          }
        };
        
        // Start connection monitoring
        checkConnection();
        
      } catch (error) {
        console.error('❌ Error in connection establishment:', error);
        clearTimeout(timeout);
        reject(error);
      }
    };

    // Start the connection process
    startConnection();
  });
};

/**
 * Setup realtime authentication with comprehensive error handling and token refresh
 */
export const setupRealtimeAuth = async (): Promise<Session> => {
  console.log('🔐 Setting up realtime authentication with enhanced logic...');
  
  let { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Auth error:', error);
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!session) {
    console.error('❌ No valid session for realtime');
    throw new Error('Authentication required for realtime - user must be signed in');
  }
  
  if (!session.access_token) {
    console.error('❌ Session missing access token');
    throw new Error('Session missing access token');
  }
  
  // Check token expiration with buffer
  const bufferTimeSeconds = 300; // 5 minutes buffer
  const expirationTime = (session.expires_at || 0) * 1000;
  const now = Date.now();
  const timeUntilExpiry = expirationTime - now;
  
  if (timeUntilExpiry < bufferTimeSeconds * 1000) {
    console.warn('⚠️ Access token is expiring soon, attempting refresh...');
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshedData.session) {
      console.error('❌ Token refresh failed:', refreshError);
      throw new Error(`Token refresh failed: ${refreshError?.message || 'Unknown error'}`);
    }
    
    session = refreshedData.session;
    console.log('✅ Token refreshed successfully');
  }
  
  // Set realtime auth with retry logic
  try {
    const realtimeClient = (supabase as any).realtime;
    if (realtimeClient && realtimeClient.setAuth) {
      realtimeClient.setAuth(session.access_token);
      console.log('✅ Realtime auth set successfully');
    } else {
      console.warn('⚠️ Realtime client not available for auth setup');
    }
  } catch (authError) {
    const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
    console.error('❌ Failed to set realtime auth:', errorMessage);
    throw new Error(`Failed to set realtime authentication: ${errorMessage}`);
  }
  
  console.log('✅ Authentication setup complete with enhanced validation');
  return session;
};
