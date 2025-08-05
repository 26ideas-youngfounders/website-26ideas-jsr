
/**
 * @fileoverview Real-Time Connection Status Indicator
 * 
 * Visual indicator showing the current status of real-time updates
 * with appropriate colors and messages for user feedback.
 * Enhanced with robust connection management integration.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

interface RealTimeStatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
  lastError?: string | null;
  onForceReconnect?: () => Promise<void>;
}

/**
 * Component that displays the current real-time connection status
 * Enhanced with improved connection management
 */
const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  connectionStatus,
  isConnected,
  retryCount,
  lastUpdate,
  lastError = null,
  onForceReconnect
}) => {
  return (
    <ConnectionStatusIndicator
      connectionStatus={connectionStatus}
      isConnected={isConnected}
      retryCount={retryCount}
      lastUpdate={lastUpdate}
      lastError={lastError}
      onForceReconnect={onForceReconnect}
    />
  );
};

export default RealTimeStatusIndicator;
