
/**
 * @fileoverview Application Status Indicator Component
 * 
 * Displays real-time status indicators for applications including
 * evaluation progress, connection status, and loading states.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Star
} from 'lucide-react';

interface ApplicationStatusIndicatorProps {
  status: string;
  evaluationStatus?: string;
  isConnected?: boolean;
  isProcessing?: boolean;
  score?: number;
}

export const ApplicationStatusIndicator: React.FC<ApplicationStatusIndicatorProps> = ({
  status,
  evaluationStatus,
  isConnected = true,
  isProcessing = false,
  score
}) => {
  /**
   * Get status icon and color
   */
  const getStatusDisplay = () => {
    if (isProcessing) {
      return {
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
        color: 'text-blue-500',
        label: 'Processing...'
      };
    }

    switch (evaluationStatus?.toLowerCase()) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          color: 'text-green-500',
          label: 'Completed'
        };
      case 'processing':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          color: 'text-blue-500',
          label: 'Processing'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-red-500',
          label: 'Failed'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          color: 'text-orange-500',
          label: 'Pending'
        };
    }
  };

  /**
   * Get score display
   */
  const getScoreDisplay = () => {
    if (!score) return null;
    
    let colorClass = 'text-gray-400';
    if (score >= 8) colorClass = 'text-green-600';
    else if (score >= 6) colorClass = 'text-yellow-600';
    else if (score >= 4) colorClass = 'text-orange-600';
    else colorClass = 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Star className="h-3 w-3" />
        <span className="font-semibold">{score}/10</span>
      </div>
    );
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center gap-2">
      {/* Main Status */}
      <div className={`flex items-center gap-1 ${statusDisplay.color}`}>
        {statusDisplay.icon}
        <span className="text-xs font-medium">{statusDisplay.label}</span>
      </div>

      {/* Score Display */}
      {getScoreDisplay()}

      {/* Connection Status */}
      <div className="flex items-center">
        {isConnected ? (
          <span title="Real-time connected">
            <Wifi className="h-3 w-3 text-green-500" />
          </span>
        ) : (
          <span title="Real-time disconnected">
            <WifiOff className="h-3 w-3 text-gray-400" />
          </span>
        )}
      </div>
    </div>
  );
};
