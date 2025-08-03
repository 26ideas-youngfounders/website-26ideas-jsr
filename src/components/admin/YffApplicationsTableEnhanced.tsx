
/**
 * @fileoverview Enhanced YFF Applications Admin Table with Real-time Updates
 * 
 * Displays YFF applications with real-time updates, automatic refresh,
 * and evaluation progress indicators.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Download, 
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { YffApplicationEvaluationDialog } from './YffApplicationEvaluationDialog';
import { ensureApplicationEvaluated } from '@/services/yff-auto-evaluation-service';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { 
  parseApplicationAnswers, 
  getDisplayScore,
  isApplicationEvaluated
} from '@/types/yff-application';

export interface YffApplicationsTableEnhancedProps {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
}

/**
 * Get status color for badges
 */
const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'submitted':
      return 'default';
    case 'under_review':
      return 'secondary';
    case 'accepted':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Get evaluation status color with enhanced states
 */
const getEvaluationStatusColor = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Get score color based on value
 */
const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Evaluation status display with progress indicators
 */
const EvaluationStatusBadge: React.FC<{ 
  status?: string; 
  applicationId: string; 
  onRetryEvaluation: (id: string) => void;
}> = ({ status, applicationId, onRetryEvaluation }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetryEvaluation(applicationId);
    setIsRetrying(false);
  };

  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing...
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Failed</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="h-6 px-2 text-xs"
        >
          {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <Badge variant={getEvaluationStatusColor(status)}>
      {status || 'pending'}
    </Badge>
  );
};

export const YffApplicationsTableEnhanced: React.FC<YffApplicationsTableEnhancedProps> = ({ 
  applications, 
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const queryClient = useQueryClient();

  // Auto-refresh data every 15 seconds to catch new applications and evaluation updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    }, 15000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Handle manual evaluation retry
  const handleRetryEvaluation = async (applicationId: string) => {
    try {
      await ensureApplicationEvaluated(applicationId);
      // Refresh data to show updated status
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    } catch (error) {
      console.error('Failed to retry evaluation:', error);
    }
  };

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications.filter(app => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        `${app.individuals?.first_name} ${app.individuals?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_id.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || app.status === statusFilter;

      // Evaluation filter
      const evaluationMatch = evaluationFilter === 'all' || app.evaluation_status === evaluationFilter;

      return searchMatch && statusMatch && evaluationMatch;
    });

    // Sort applications
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'score':
          aValue = a.overall_score || 0;
          bValue = b.overall_score || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, evaluationFilter, sortBy, sortOrder]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter(app => app.status === 'submitted').length;
    const underReview = applications.filter(app => app.status === 'under_review').length;
    const evaluated = applications.filter(app => isApplicationEvaluated(app)).length;
    
    // Calculate average score only from evaluated applications
    const evaluatedApps = applications.filter(app => isApplicationEvaluated(app));
    const avgScore = evaluatedApps.length > 0 
      ? evaluatedApps.reduce((acc, app) => acc + (app.overall_score || 0), 0) / evaluatedApps.length
      : 0;

    return { total, submitted, underReview, evaluated, avgScore: Math.round(avgScore * 10) / 10 };
  }, [applications]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              AI Evaluated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
              {stats.avgScore > 0 ? `${stats.avgScore}/10` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by evaluation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Evaluations</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['yff-applications'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Applications Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('date');
                    setSortOrder('desc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Submitted
                  {sortBy === 'date' && (
                    <span className="text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  if (sortBy === 'score') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('score');
                    setSortOrder('desc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  AI Score
                  {sortBy === 'score' && (
                    <span className="text-xs">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Evaluation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedApplications.map((application) => {
              const parsedAnswers = parseApplicationAnswers(application.answers);
              const stage = parsedAnswers.questionnaire_answers?.productStage || 'Unknown';
              
              return (
                <TableRow key={application.application_id}>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(application.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {application.individuals?.first_name} {application.individuals?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {parsedAnswers.team?.ventureName || 'No venture name'}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {application.application_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(application.status)}>
                      {application.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`font-semibold ${getScoreColor(application.overall_score)}`}>
                      {getDisplayScore(application.overall_score)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EvaluationStatusBadge
                      status={application.evaluation_status}
                      applicationId={application.application_id}
                      onRetryEvaluation={handleRetryEvaluation}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <YffApplicationEvaluationDialog 
                        application={{
                          application_id: application.application_id,
                          status: application.status,
                          evaluation_status: application.evaluation_status,
                          overall_score: application.overall_score,
                          evaluation_completed_at: application.evaluation_completed_at,
                          answers: application.answers,
                          individuals: application.individuals
                        }}
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Update Status</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredAndSortedApplications.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No applications found matching your criteria.</div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['yff-applications'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
