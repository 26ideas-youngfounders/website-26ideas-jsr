
/**
 * @fileoverview Real-time Connection Health Monitor
 * 
 * Displays real-time connection status, diagnostics, and health metrics
 * for monitoring WebSocket connection stability in the admin dashboard.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Clock
} from 'lucide-react';

interface ConnectionHealthMetrics {
  status: string;
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
  uptime: number;
  eventCount: number;
  lastHeartbeat: Date | null;
  connectionId: string | null;
}

export const RealtimeConnectionMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ConnectionHealthMetrics>({
    status: 'disconnected',
    isConnected: false,
    retryCount: 0,
    lastUpdate: null,
    uptime: 0,
    eventCount: 0,
    lastHeartbeat: null,
    connectionId: null
  });

  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Get status display configuration
   */
  const getStatusConfig = () => {
    switch (metrics.status) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Connected'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          color: 'bg-blue-100 text-blue-800',
          label: 'Connecting'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Error'
        };
      case 'fallback':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Fallback Mode'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Disconnected'
        };
    }
  };

  /**
   * Format duration for display
   */
  const formatDuration = (ms: number): string => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleString();
  };

  // Mock metrics update (in real implementation, this would connect to actual metrics)
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with actual metrics from the connection manager
      setMetrics(prev => ({
        ...prev,
        uptime: prev.isConnected ? prev.uptime + 5000 : 0,
        lastHeartbeat: prev.isConnected ? new Date() : prev.lastHeartbeat
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusConfig = getStatusConfig();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Connection Health
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Status Overview */}
        <div className="flex items-center gap-3">
          <Badge className={`${statusConfig.color} gap-1.5`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
          
          {metrics.isConnected && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(metrics.uptime)} uptime
            </div>
          )}
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{metrics.eventCount}</div>
            <div className="text-muted-foreground">Events</div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{metrics.retryCount}</div>
            <div className="text-muted-foreground">Retries</div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">
              {metrics.isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mx-auto" />
              )}
            </div>
            <div className="text-muted-foreground">Health</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-medium text-muted-foreground">Last Update</div>
                <div>{formatTimestamp(metrics.lastUpdate)}</div>
              </div>
              
              <div>
                <div className="font-medium text-muted-foreground">Last Heartbeat</div>
                <div>{formatTimestamp(metrics.lastHeartbeat)}</div>
              </div>
              
              <div>
                <div className="font-medium text-muted-foreground">Connection ID</div>
                <div className="truncate">
                  {metrics.connectionId || 'None'}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-muted-foreground">Status</div>
                <div className="capitalize">{metrics.status}</div>
              </div>
            </div>

            {/* Debug Actions */}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="text-xs">
                Reconnect
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                Test Connection
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                View Logs
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
