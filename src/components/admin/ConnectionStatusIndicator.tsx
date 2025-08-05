
/**
 * @fileoverview Enhanced Connection Status Indicator
 * 
 * Comprehensive connection status indicator that shows WebSocket health,
 * connection state, retry attempts, and provides manual reconnection.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';

interface ConnectionStatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
  lastError: string | null;
  onForceReconnect?: () => Promise<void>;
  className?: string;
}

/**
 * Enhanced connection status indicator with detailed information
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  connectionStatus,
  isConnected,
  retryCount,
  lastUpdate,
  lastError,
  onForceReconnect,
  className = ""
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <Wifi className="h-3 w-3" />,
          text: 'Live Updates Active',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          description: 'Real-time updates are working perfectly',
          showPulse: true
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          text: 'Connecting...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          description: `Establishing real-time connection${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`,
          showPulse: true
        };
      case 'fallback':
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Periodic Updates',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          description: 'Using periodic refresh (updates every 30 seconds)',
          showPulse: false
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Connection Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          description: 'Real-time updates unavailable, check your connection',
          showPulse: false
        };
      case 'disconnected':
      default:
        return {
          variant: 'outline' as const,
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Disconnected',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Real-time updates are not active',
          showPulse: false
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

  const formatUptime = (lastUpdate: Date | null) => {
    if (!lastUpdate || connectionStatus !== 'connected') return null;
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s uptime`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m uptime`;
    return `${Math.floor(diff / 3600)}h uptime`;
  };

  const uptime = formatUptime(lastUpdate);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={`${config.borderColor} ${config.bgColor} border transition-all duration-200`}>
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  {/* Status Icon with Pulse Effect */}
                  <div className="relative">
                    <span className={config.color}>
                      {config.icon}
                    </span>
                    {config.showPulse && (
                      <div className="absolute inset-0 animate-ping">
                        <Activity className="h-3 w-3 text-green-400 opacity-75" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status Text */}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{config.text}</span>
                    {uptime && (
                      <span className="text-xs text-muted-foreground">{uptime}</span>
                    )}
                  </div>

                  {/* Connection Health Indicator */}
                  {isConnected && connectionStatus === 'connected' && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-sm space-y-2">
              <div className="font-medium">{config.description}</div>
              
              {lastUpdate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  <span>Last update: {formatLastUpdate(lastUpdate)}</span>
                </div>
              )}
              
              {retryCount > 0 && connectionStatus !== 'connected' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry attempts: {retryCount}</span>
                </div>
              )}
              
              {lastError && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Error: {lastError}</span>
                </div>
              )}

              {/* Connection Quality Indicators */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span>WebSocket:</span>
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isConnected ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span>Status:</span>
                  <Badge variant={config.variant} className="text-xs">
                    {connectionStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Force Reconnect Button */}
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onForceReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onForceReconnect}
          className="h-8 px-2 text-xs"
        >
          <Zap className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
