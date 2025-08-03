import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Search, Eye, Download, Filter, MoreHorizontal, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { YffApplicationDetailsDialog } from './YffApplicationDetailsDialog';
import { YffApplicationEvaluationDialog } from './YffApplicationEvaluationDialog';
import ApplicationScoringDialog from './ApplicationScoringDialog';
import { parseApplicationAnswers, parseEvaluationData, type ExtendedYffApplication } from '@/types/yff-application';

interface YffApplicationsTableProps {
  applications: ExtendedYffApplication[];
  isLoading: boolean;
}

/**
 * Get badge variant based on evaluation status
 */
const getEvaluationStatusBadge = (status?: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Evaluated</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'pending':
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

/**
 * Get score color and display
 */
const getScoreDisplay = (score?: number) => {
  if (!score || score === 0) return <span className="text-gray-400">-</span>;
  
  let colorClass = 'text-gray-600';
  if (score >= 8) colorClass = 'text-green-600 font-semibold';
  else if (score >= 6) colorClass = 'text-yellow-600 font-semibold';
  else if (score >= 4) colorClass = 'text-orange-600 font-semibold';
  else colorClass = 'text-red-600 font-semibold';
  
  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Star className="h-3 w-3" />
      <span>{score}/10</span>
    </div>
  );
};

export const YffApplicationsTable: React.FC<YffApplicationsTableProps> = ({
  applications,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(app => {
    const parsedAnswers = parseApplicationAnswers(app.answers);
    const teamName = parsedAnswers.team?.teamName || '';
    const ventureName = parsedAnswers.team?.ventureName || '';
    const applicantName = app.individuals ? 
      `${app.individuals.first_name} ${app.individuals.last_name}` : '';
    
    const matchesSearch = searchTerm === '' || 
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ventureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const matchesEvaluation = evaluationFilter === 'all' || 
      (app.evaluation_status || 'pending') === evaluationFilter;
    
    const matchesScore = scoreFilter === 'all' || (() => {
      const score = app.overall_score || 0;
      switch (scoreFilter) {
        case 'excellent': return score >= 8;
        case 'good': return score >= 6 && score < 8;
        case 'fair': return score >= 4 && score < 6;
        case 'poor': return score < 4;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesEvaluation && matchesScore;
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by team name, venture, applicant, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Evaluation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Evaluations</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="excellent">8-10 (Excellent)</SelectItem>
              <SelectItem value="good">6-7.9 (Good)</SelectItem>
              <SelectItem value="fair">4-5.9 (Fair)</SelectItem>
              <SelectItem value="poor">0-3.9 (Poor)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredApplications.length} of {applications.length} applications
      </div>

      {/* Applications table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team/Venture</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evaluation</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No applications found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => {
                const parsedAnswers = parseApplicationAnswers(application.answers);
                const teamName = parsedAnswers.team?.teamName || 'N/A';
                const ventureName = parsedAnswers.team?.ventureName || 'N/A';
                
                return (
                  <TableRow key={application.application_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{teamName}</div>
                        <div className="text-sm text-gray-500">{ventureName}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.individuals?.first_name} {application.individuals?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.individuals?.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={
                        application.status === 'accepted' ? 'default' :
                        application.status === 'under_review' ? 'secondary' :
                        application.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {application.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {getEvaluationStatusBadge(application.evaluation_status)}
                    </TableCell>

                    <TableCell>
                      {getScoreDisplay(application.overall_score)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {application.submitted_at ? 
                          new Date(application.submitted_at).toLocaleDateString() : 
                          'N/A'
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <YffApplicationDetailsDialog application={application} />
                        <YffApplicationEvaluationDialog application={application} />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </DropdownMenuItem>
                            <ApplicationScoringDialog application={application} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
