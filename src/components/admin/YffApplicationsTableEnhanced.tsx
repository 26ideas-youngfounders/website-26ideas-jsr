
/**
 * @fileoverview Enhanced YFF Applications Table Component
 * 
 * Advanced table component with comprehensive application management features,
 * utilizing the new foreign key relationship for improved data access.
 * 
 * @version 2.3.0
 * @author 26ideas Development Team
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YffApplicationDetailsDialogEnhanced } from './YffApplicationDetailsDialogEnhanced';
import { ApplicationScoringDialog } from './ApplicationScoringDialog';
import { ApplicationStatusIndicator } from './ApplicationStatusIndicator';
import { 
  Eye, 
  Star, 
  Search, 
  Filter,
  ArrowUpDown,
  Users,
  Building,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import type { EnhancedYffApplication } from '@/types/yff-application';

interface YffApplicationsTableEnhancedProps {
  applications: EnhancedYffApplication[];
  isLoading: boolean;
}

type SortField = 'created_at' | 'name' | 'score' | 'status' | 'evaluation_status';
type SortDirection = 'asc' | 'desc';

export const YffApplicationsTableEnhanced: React.FC<YffApplicationsTableEnhancedProps> = ({
  applications,
  isLoading,
}) => {
  const [selectedApplication, setSelectedApplication] = useState<EnhancedYffApplication | null>(null);
  const [scoringApplication, setScoringApplication] = useState<EnhancedYffApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  /**
   * Filter and sort applications based on current filters
   */
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.individual?.first_name?.toLowerCase().includes(searchLower) ||
        app.individual?.last_name?.toLowerCase().includes(searchLower) ||
        app.individual?.email?.toLowerCase().includes(searchLower) ||
        app.teamRegistration?.venture_name?.toLowerCase().includes(searchLower) ||
        app.teamRegistration?.team_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply evaluation filter
    if (evaluationFilter !== 'all') {
      filtered = filtered.filter(app => app.evaluation_status === evaluationFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.individual?.first_name || ''} ${a.individual?.last_name || ''}`.trim();
          bValue = `${b.individual?.first_name || ''} ${b.individual?.last_name || ''}`.trim();
          break;
        case 'score':
          aValue = a.overall_score || 0;
          bValue = b.overall_score || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'evaluation_status':
          aValue = a.evaluation_status;
          bValue = b.evaluation_status;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, evaluationFilter, sortField, sortDirection]);

  /**
   * Handle sort field change
   */
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'submitted': return 'default';
      case 'under_review': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  /**
   * Get evaluation status badge variant
   */
  const getEvaluationVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            YFF Applications ({filteredAndSortedApplications.length})
          </CardTitle>
          
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or venture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Evaluation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Evaluations</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAndSortedApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No applications found</p>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || evaluationFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Applications will appear here once submitted.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-medium flex items-center gap-1"
                      >
                        Applicant
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        Venture Details
                      </div>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="h-auto p-0 font-medium flex items-center gap-1"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('evaluation_status')}
                        className="h-auto p-0 font-medium flex items-center gap-1"
                      >
                        Evaluation
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('score')}
                        className="h-auto p-0 font-medium flex items-center gap-1"
                      >
                        Score
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('created_at')}
                        className="h-auto p-0 font-medium flex items-center gap-1"
                      >
                        <Calendar className="h-4 w-4" />
                        Submitted
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedApplications.map((application) => (
                    <TableRow key={application.application_id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {application.individual?.first_name} {application.individual?.last_name}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {application.individual?.email}
                          </div>
                          {application.individual?.phone_number && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {application.individual.country_code} {application.individual.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {application.teamRegistration?.venture_name && (
                            <div className="font-medium">{application.teamRegistration.venture_name}</div>
                          )}
                          {application.teamRegistration?.team_name && (
                            <div className="text-sm text-muted-foreground">
                              Team: {application.teamRegistration.team_name}
                            </div>
                          )}
                          {application.teamRegistration?.industry_sector && (
                            <Badge variant="outline" className="text-xs">
                              {application.teamRegistration.industry_sector}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ApplicationStatusIndicator status={application.status} />
                          <Badge variant={getStatusVariant(application.status)}>
                            {application.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getEvaluationVariant(application.evaluation_status)}>
                          {application.evaluation_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {application.overall_score !== null && application.overall_score !== undefined ? (
                            <>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {application.overall_score.toFixed(1)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not scored</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(application.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(application.created_at), 'HH:mm')}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScoringApplication(application)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Score
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      {selectedApplication && (
        <YffApplicationDetailsDialogEnhanced
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}

      {/* Application Scoring Dialog */}
      {scoringApplication && (
        <ApplicationScoringDialog
          application={{
            applicationId: scoringApplication.application_id,
            individualId: scoringApplication.individual_id,
            answers: scoringApplication.answers,
            currentScore: scoringApplication.overall_score,
            evaluationData: scoringApplication.evaluation_data,
          }}
          isOpen={!!scoringApplication}
          onClose={() => setScoringApplication(null)}
        />
      )}
    </>
  );
};
