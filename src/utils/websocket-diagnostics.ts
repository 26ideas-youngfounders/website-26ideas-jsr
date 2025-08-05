
/**
 * @fileoverview WebSocket Diagnostic Utilities
 * 
 * Comprehensive diagnostic tools for WebSocket connection troubleshooting
 * and state monitoring with detailed logging and error reporting.
 * 
 * @version 1.0.0
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
 * Run comprehensive WebSocket diagnostics
 */
export const diagnoseWebSocketConnection = async (): Promise<WebSocketDiagnostics> => {
  console.log('🔍 === WebSocket Diagnostic Start ===');
  
  // Check environment configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jdqsgigwbcukxijiunwl.supabase.co';
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  
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
  
  // Check realtime socket status
  const realtimeSocket = (supabase as any).realtime?.socket;
  console.log('Realtime Socket Available:', !!realtimeSocket);
  
  let socketState: number | undefined;
  let socketStateName = 'UNAVAILABLE';
  
  if (realtimeSocket) {
    socketState = realtimeSocket.readyState;
    socketStateName = WEBSOCKET_STATE_NAMES[socketState] || 'UNKNOWN';
    console.log('Socket State:', `${socketState} (${socketStateName})`);
    console.log('Socket URL:', realtimeSocket.endPoint || 'Not available');
    console.log('Socket Connection State:', realtimeSocket.connectionState || 'Unknown');
    console.log('Socket Channels:', Object.keys(realtimeSocket.channels || {}).length);
  }
  
  // Additional environment checks
  console.log('Environment Details:');
  console.log('- Window Location:', window.location.href);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Online Status:', navigator.onLine);
  
  console.log('🔍 === Diagnostic Complete ===');
  
  return {
    isConfigured: !!(supabaseUrl && hasSupabaseKey),
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
 * Force WebSocket connection establishment with enhanced monitoring
 */
export const ensureWebSocketConnection = async (timeoutMs: number = 15000): Promise<boolean> => {
  console.log('🔄 Ensuring WebSocket connection...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('❌ WebSocket connection timeout after', timeoutMs, 'ms');
      reject(new Error(`WebSocket connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const realtimeSocket = (supabase as any).realtime?.socket;
    
    if (!realtimeSocket) {
      clearTimeout(timeout);
      reject(new Error('Realtime socket not available - check Supabase configuration'));
      return;
    }

    const initialState = realtimeSocket.readyState;
    const initialStateName = WEBSOCKET_STATE_NAMES[initialState] || 'UNKNOWN';
    console.log(`🔍 Initial WebSocket state: ${initialState} (${initialStateName})`);
    
    // Force connection if not connected
    if (initialState !== WEBSOCKET_STATES.OPEN) {
      console.log('🔄 Forcing WebSocket connection...');
      try {
        (supabase as any).realtime.connect();
      } catch (connectError) {
        console.error('❌ Error forcing connection:', connectError);
        clearTimeout(timeout);
        reject(new Error(`Failed to force connection: ${connectError}`));
        return;
      }
    }

    // Monitor connection with enhanced logging
    let attemptCount = 0;
    const maxAttempts = Math.floor(timeoutMs / 100); // Check every 100ms
    
    const checkConnection = () => {
      attemptCount++;
      const currentState = realtimeSocket.readyState;
      const currentStateName = WEBSOCKET_STATE_NAMES[currentState] || 'UNKNOWN';
      
      if (attemptCount % 10 === 0 || attemptCount <= 5) { // Log every 1s or first 5 attempts
        console.log(`🔍 Connection check ${attemptCount}: ${currentState} (${currentStateName})`);
      }
      
      if (currentState === WEBSOCKET_STATES.OPEN) {
        console.log('✅ WebSocket connection established successfully');
        clearTimeout(timeout);
        resolve(true);
      } else if (currentState === WEBSOCKET_STATES.CLOSED) {
        console.error('❌ WebSocket connection closed during establishment');
        clearTimeout(timeout);
        reject(new Error('WebSocket connection closed unexpectedly'));
      } else if (attemptCount >= maxAttempts) {
        console.error(`❌ WebSocket failed to reach OPEN state after ${attemptCount} attempts (stuck in ${currentStateName})`);
        clearTimeout(timeout);
        reject(new Error(`WebSocket connection failed - stuck in ${currentStateName} state after ${attemptCount} attempts`));
      } else {
        // Continue monitoring
        setTimeout(checkConnection, 100);
      }
    };
    
    checkConnection();
  });
};

/**
 * Setup realtime authentication with comprehensive error handling
 */
export const setupRealtimeAuth = async (): Promise<Session> => {
  console.log('🔐 Setting up realtime authentication...');
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
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
  
  // Check token expiration
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    console.warn('⚠️ Access token is expired, attempting refresh...');
    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshedSession.session) {
      console.error('❌ Token refresh failed:', refreshError);
      throw new Error(`Token refresh failed: ${refreshError?.message || 'Unknown error'}`);
    }
    
    console.log('✅ Token refreshed successfully');
    // Update session reference
    const updatedSession = refreshedSession.session;
    (supabase as any).realtime.setAuth(updatedSession.access_token);
    console.log('✅ Realtime auth set with refreshed token');
    return updatedSession;
  }
  
  // Set realtime auth with current token
  try {
    (supabase as any).realtime.setAuth(session.access_token);
    console.log('✅ Realtime auth set successfully');
  } catch (authError) {
    const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
    console.error('❌ Failed to set realtime auth:', errorMessage);
    throw new Error(`Failed to set realtime authentication: ${errorMessage}`);
  }
  
  console.log('✅ Authentication setup complete');
  return session;
};
