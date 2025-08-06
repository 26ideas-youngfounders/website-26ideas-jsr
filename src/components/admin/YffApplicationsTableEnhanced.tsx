
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  YffApplication, 
  DialogApplication,
  parseApplicationAnswers, 
  parseEvaluationData,
  convertToDialogApplication
} from '@/types/yff-application';
import { YffApplicationDetailsDialog } from './YffApplicationDetailsDialog';
import ApplicationScoringDialog from './ApplicationScoringDialog';
import YffApplicationEvaluationDialog from './YffApplicationEvaluationDialog';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface YffApplicationsTableEnhancedProps {
  applications?: YffApplication[];
  isLoading?: boolean;
}

export const YffApplicationsTableEnhanced: React.FC<YffApplicationsTableEnhancedProps> = ({ 
  applications: propApplications, 
  isLoading: propIsLoading 
}) => {
  const [applications, setApplications] = useState<YffApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10);

  // Use query only if no props are provided
  const { data, isLoading: queryLoading, error } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          application_id,
          individual_id,
          status,
          application_round,
          answers,
          cumulative_score,
          reviewer_scores,
          submitted_at,
          created_at,
          updated_at,
          evaluation_status,
          overall_score,
          evaluation_completed_at,
          evaluation_data,
          individuals (
            first_name,
            last_name,
            email
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching YFF applications:', error);
        throw error;
      }

      return data as YffApplication[];
    },
    enabled: !propApplications, // Only run query if no prop applications provided
  });

  // Use prop data if available, otherwise use query data
  const isLoading = propIsLoading !== undefined ? propIsLoading : queryLoading;
  const applicationsData = propApplications || data || [];

  useEffect(() => {
    setApplications(applicationsData);
  }, [applicationsData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter
  };

  const filteredApplications = applications?.filter((app) => {
    const searchTerm = searchQuery.toLowerCase();
    const parsedAnswers = parseApplicationAnswers(app.answers);
    const matchesSearch =
      app.application_id.toLowerCase().includes(searchTerm) ||
      app.individuals?.first_name?.toLowerCase().includes(searchTerm) ||
      app.individuals?.last_name?.toLowerCase().includes(searchTerm) ||
      parsedAnswers?.team?.email?.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === '' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil((filteredApplications?.length || 0) / applicationsPerPage);
  const paginatedApplications = filteredApplications?.slice(
    (currentPage - 1) * applicationsPerPage,
    currentPage * applicationsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <div className="space-x-2 flex items-center">
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
        </div>
        <div className="space-x-2 flex items-center">
          <Label htmlFor="status">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Application ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4" />
                    AI Score
                  </div>
                </TableHead>
                <TableHead>Evaluation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading applications...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredApplications?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications?.map((app) => {
                  const answers = parseApplicationAnswers(app.answers);
                  const evaluationData = parseEvaluationData(app.evaluation_data);
                  
                  // Use the type-safe conversion function
                  const applicationForDialog: DialogApplication = convertToDialogApplication(app);

                  // Create a properly typed application for scoring dialog
                  const scoringApplication = {
                    application_id: app.application_id,
                    answers: answers as Record<string, any>,
                    cumulative_score: app.cumulative_score || 0,
                    individuals: {
                      first_name: app.individuals?.first_name || '',
                      last_name: app.individuals?.last_name || ''
                    }
                  };

                  return (
                    <TableRow key={app.application_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {app.individuals?.first_name || 'Unknown'} {app.individuals?.last_name || 'User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {answers.team?.email || app.individuals?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {app.application_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            app.status === 'submitted' ? 'default' :
                            app.status === 'under_review' ? 'secondary' :
                            app.status === 'rejected' ? 'destructive' :
                            app.status === 'approved' ? 'default' :
                            'outline'
                          }
                        >
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {answers.questionnaire_answers?.productStage || 'Idea Stage / MLP / Working Prototype'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {app.overall_score ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-bold">{app.overall_score.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">/10</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={app.evaluation_status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {app.evaluation_status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <YffApplicationDetailsDialog application={applicationForDialog} />
                          <ApplicationScoringDialog application={scoringApplication} />
                          <YffApplicationEvaluationDialog application={applicationForDialog} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
