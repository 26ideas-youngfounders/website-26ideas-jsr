
/**
 * @fileoverview YFF Applications Management Table
 * 
 * Admin interface for viewing, filtering, and managing YFF applications
 * with integrated AI evaluation display and controls.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YffApplicationDetailsDialog } from './YffApplicationDetailsDialog';
import { YffApplicationEvaluationDialog } from './YffApplicationEvaluationDialog';
import { ApplicationScoringDialog } from './ApplicationScoringDialog';
import { parseApplicationAnswers, type ExtendedYffApplication } from '@/types/yff-application';
import { 
  Search, 
  Users, 
  Calendar, 
  Filter,
  Star,
  BarChart3,
  Trophy,
  Clock,
  AlertTriangle
} from 'lucide-react';

type ApplicationWithIndividual = ExtendedYffApplication & {
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

/**
 * Get status badge variant based on status
 */
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
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
 * Get evaluation status badge
 */
const getEvaluationStatusBadge = (status?: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Evaluated</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

/**
 * Get score color and badge based on score range
 */
const getScoreBadge = (score?: number) => {
  if (!score || score === 0) {
    return null;
  }
  
  if (score >= 8) {
    return <Badge className="bg-green-100 text-green-800 font-semibold">{score}/10</Badge>;
  } else if (score >= 6) {
    return <Badge className="bg-yellow-100 text-yellow-800 font-semibold">{score}/10</Badge>;
  } else if (score >= 4) {
    return <Badge className="bg-orange-100 text-orange-800 font-semibold">{score}/10</Badge>;
  } else {
    return <Badge className="bg-red-100 text-red-800 font-semibold">{score}/10</Badge>;
  }
};

/**
 * Main YFF Applications Table Component
 */
export const YffApplicationsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');

  // Fetch applications with individual data
  const { data: applications, isLoading, error, refetch } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async () => {
      console.log('Fetching YFF applications...');
      
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      console.log('Fetched applications:', data?.length || 0);
      return data as ApplicationWithIndividual[];
    },
  });

  // Filter and search logic
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter((app) => {
      // Search filter
      const fullName = `${app.individuals?.first_name || ''} ${app.individuals?.last_name || ''}`.toLowerCase();
      const email = app.individuals?.email?.toLowerCase() || '';
      const searchMatch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        app.application_id.toLowerCase().includes(searchTerm.toLowerCase());

      if (searchTerm && !searchMatch) return false;

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Evaluation status filter
      if (evaluationFilter !== 'all' && (app.evaluation_status || 'pending') !== evaluationFilter) {
        return false;
      }

      return true;
    });
  }, [applications, searchTerm, statusFilter, evaluationFilter]);

  // Statistics calculations
  const stats = useMemo(() => {
    if (!applications) return { total: 0, evaluated: 0, avgScore: 0, pending: 0 };

    const total = applications.length;
    const evaluated = applications.filter(app => app.evaluation_status === 'completed').length;
    const pending = applications.filter(app => !app.evaluation_status || app.evaluation_status === 'pending').length;
    const scoresSum = applications
      .filter(app => app.overall_score && app.overall_score > 0)
      .reduce((sum, app) => sum + (app.overall_score || 0), 0);
    const avgScore = evaluated > 0 ? Math.round((scoresSum / evaluated) * 10) / 10 : 0;

    return { total, evaluated, avgScore, pending };
  }, [applications]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading applications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Applications</h3>
            <p className="text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">AI Evaluated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.evaluated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgScore}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Evaluation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or application ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-48">
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
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Applications ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Evaluation</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => {
                  const parsedAnswers = parseApplicationAnswers(application.answers);
                  const teamName = parsedAnswers.team?.teamName || 'No Team Name';
                  const ventureName = parsedAnswers.team?.ventureName || 'No Venture Name';

                  return (
                    <TableRow key={application.application_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {application.individuals?.first_name} {application.individuals?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{application.individuals?.email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Team: {teamName} • Venture: {ventureName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {application.application_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(application.status)}>
                          {application.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getEvaluationStatusBadge(application.evaluation_status)}
                          {application.evaluation_completed_at && (
                            <div className="text-xs text-gray-500">
                              {new Date(application.evaluation_completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getScoreBadge(application.overall_score)}
                          {application.overall_score && application.overall_score > 0 && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {application.submitted_at 
                            ? new Date(application.submitted_at).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <YffApplicationDetailsDialog application={application} />
                          <YffApplicationEvaluationDialog application={application} />
                          <ApplicationScoringDialog application={application} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || evaluationFilter !== 'all'
                    ? 'Try adjusting your filters or search criteria.'
                    : 'No applications have been submitted yet.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
