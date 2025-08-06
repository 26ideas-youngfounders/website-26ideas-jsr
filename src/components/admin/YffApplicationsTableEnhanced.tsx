/**
 * @fileoverview Enhanced YFF Applications Admin Table with AI Scoring Integration
 * 
 * Displays YFF applications with comprehensive AI evaluation results,
 * real-time updates, and advanced filtering capabilities.
 * 
 * @version 2.0.0
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  RefreshCw,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { YffApplicationEvaluationDialog } from './YffApplicationEvaluationDialog';
import { useBackgroundScoring } from '@/hooks/useBackgroundScoring';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { parseApplicationAnswers, parseEvaluationData } from '@/types/yff-application';
import { useToast } from '@/hooks/use-toast';

export interface YffApplicationsTableEnhancedProps {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
}

type SortField = 'date' | 'score' | 'status' | 'name';
type SortOrder = 'asc' | 'desc';

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
 * Get evaluation status color
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
const getScoreColor = (score?: number): string => {
  if (!score) return 'text-gray-400';
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

export const YffApplicationsTableEnhanced: React.FC<YffApplicationsTableEnhancedProps> = ({ 
  applications, 
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { triggerScoring } = useBackgroundScoring();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Auto-refresh mechanism
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, queryClient]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    toast({
      title: "Refreshed",
      description: "Application data has been updated.",
    });
  };

  /**
   * Handle sort field change
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  /**
   * Handle manual evaluation trigger
   */
  const handleTriggerEvaluation = async (applicationId: string) => {
    try {
      await triggerScoring(applicationId);
      toast({
        title: "Evaluation Started",
        description: "AI evaluation has been triggered for this application.",
      });
    } catch (error) {
      console.error('Failed to trigger evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to trigger evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Filter and sort applications
   */
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

      switch (sortField) {
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
        case 'name':
          aValue = `${a.individuals?.first_name} ${a.individuals?.last_name}`.toLowerCase();
          bValue = `${b.individuals?.first_name} ${b.individuals?.last_name}`.toLowerCase();
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
  }, [applications, searchTerm, statusFilter, evaluationFilter, sortField, sortOrder]);

  /**
   * Calculate summary statistics
   */
  const stats = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter(app => app.status === 'submitted').length;
    const underReview = applications.filter(app => app.status === 'under_review').length;
    const evaluated = applications.filter(app => app.evaluation_status === 'completed').length;
    const evaluatedApps = applications.filter(app => app.evaluation_status === 'completed' && app.overall_score && app.overall_score > 0);
    const avgScore = evaluatedApps.length > 0
      ? evaluatedApps.reduce((acc, app) => acc + (app.overall_score || 0), 0) / evaluatedApps.length
      : 0;

    return { total, submitted, underReview, evaluated, avgScore: Math.round(avgScore * 10) / 10 };
  }, [applications]);

  /**
   * Render sort icon
   */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

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
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Total Applications</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Submitted</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Under Review</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.underReview}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">AI Evaluated</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Avg Score</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
            {stats.avgScore || '—'}/10
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
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
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submitted
                  {renderSortIcon('date')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Applicant
                  {renderSortIcon('name')}
                </div>
              </TableHead>
              
              <TableHead>Application ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  AI Score
                  {renderSortIcon('score')}
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
                <TableRow key={application.application_id} className="hover:bg-gray-50">
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
                    <div className="flex items-center gap-2">
                      {application.overall_score ? (
                        <div className={`font-semibold ${getScoreColor(application.overall_score)}`}>
                          {application.overall_score}/10
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      
                      {application.evaluation_status === 'processing' && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={getEvaluationStatusColor(application.evaluation_status)}>
                      {application.evaluation_status || 'pending'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <YffApplicationEvaluationDialog 
                        application={application}
                      />
                      
                      {(!application.evaluation_status || application.evaluation_status === 'pending' || application.evaluation_status === 'failed') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTriggerEvaluation(application.application_id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Evaluate
                        </Button>
                      )}
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
          </div>
        )}
      </Card>
    </div>
  );
};
