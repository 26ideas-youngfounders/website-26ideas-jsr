
/**
 * @fileoverview Background Job Queue Monitoring Component
 * 
 * Provides admin interface for monitoring scoring job queue status,
 * viewing job statistics, and managing failed jobs.
 */

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBackgroundScoring } from '@/hooks/useBackgroundScoring';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  AlertTriangle,
  Trash2,
  Play
} from 'lucide-react';

export const BackgroundJobMonitor: React.FC = () => {
  const {
    queueStatus,
    isWorkerActive,
    refreshStatus,
    cleanupOldJobs,
    retryFailedJob
  } = useBackgroundScoring();

  /**
   * Get status badge variant based on job count
   */
  const getStatusBadgeVariant = (count: number, type: string) => {
    if (count === 0) return 'secondary';
    if (type === 'failed') return 'destructive';
    if (type === 'processing') return 'default';
    return 'outline';
  };

  /**
   * Handle cleanup old jobs
   */
  const handleCleanup = async () => {
    await cleanupOldJobs(7);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Background Job Monitor</h3>
          <p className="text-sm text-gray-500">
            Monitor AI scoring job queue and worker status
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isWorkerActive ? 'default' : 'secondary'}>
            <Activity className="h-3 w-3 mr-1" />
            Worker {isWorkerActive ? 'Active' : 'Idle'}
          </Badge>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshStatus}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              Queued
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{queueStatus.queued}</div>
              <Badge variant={getStatusBadgeVariant(queueStatus.queued, 'queued')}>
                {queueStatus.queued > 0 ? 'Pending' : 'Empty'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Play className="h-4 w-4 mr-2 text-blue-500" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{queueStatus.processing}</div>
              <Badge variant={getStatusBadgeVariant(queueStatus.processing, 'processing')}>
                {queueStatus.processing > 0 ? 'Active' : 'Idle'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{queueStatus.completed}</div>
              <Badge variant="secondary">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{queueStatus.failed}</div>
              <Badge variant={getStatusBadgeVariant(queueStatus.failed, 'failed')}>
                {queueStatus.failed > 0 ? 'Needs Review' : 'None'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{queueStatus.total}</div>
              <Badge variant="outline">
                All Time
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {queueStatus.failed === 0 && queueStatus.processing < 5 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Queue Healthy</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Requires Attention</span>
                </>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Alerts */}
          {queueStatus.failed > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">
                {queueStatus.failed} jobs have failed and may need manual review
              </span>
            </div>
          )}

          {queueStatus.queued > 10 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700">
                Queue backlog detected: {queueStatus.queued} jobs waiting
              </span>
            </div>
          )}

          {/* Management Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCleanup}
              disabled={queueStatus.completed === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Cleanup Old Jobs
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshStatus}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Worker Status:</span>
            <Badge variant={isWorkerActive ? 'default' : 'secondary'}>
              {isWorkerActive ? 'Running' : 'Idle'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Timeout:</span>
            <span>10 minutes</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Max Retries:</span>
            <span>3 attempts</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Retry Delays:</span>
            <span>30s, 2m, 5m</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
