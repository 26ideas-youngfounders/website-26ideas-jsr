
/**
 * @fileoverview Real-Time Connection Status Indicator
 * 
 * Visual indicator showing the current status of real-time updates
 * with appropriate colors and messages for user feedback.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface RealTimeStatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
}

/**
 * Component that displays the current real-time connection status
 */
const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  connectionStatus,
  isConnected,
  retryCount,
  lastUpdate
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <Wifi className="h-3 w-3" />,
          text: 'Live Updates Active',
          color: 'text-green-600',
          description: 'Real-time updates are working normally'
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          text: 'Connecting...',
          color: 'text-blue-600',
          description: `Establishing real-time connection${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`
        };
      case 'fallback':
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Periodic Updates',
          color: 'text-yellow-600',
          description: 'Using periodic refresh (updates every 15 seconds)'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Connection Error',
          color: 'text-red-600',
          description: 'Real-time updates unavailable, switching to backup mode'
        };
      case 'disconnected':
      default:
        return {
          variant: 'outline' as const,
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Disconnected',
          color: 'text-gray-600',
          description: 'Real-time updates are not active'
        };
    }
  };

  const config = getStatusConfig();
  
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={config.variant} className="flex items-center gap-1.5">
            <span className={config.color}>
              {config.icon}
            </span>
            <span className="text-xs">{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{config.description}</p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last update: {formatLastUpdate(lastUpdate)}
              </p>
            )}
            {retryCount > 0 && connectionStatus !== 'connected' && (
              <p className="text-xs text-muted-foreground mt-1">
                Retry attempts: {retryCount}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RealTimeStatusIndicator;
