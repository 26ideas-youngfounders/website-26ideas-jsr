
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  FileText, 
  User, 
  UserCheck, 
  Calendar,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TypeformSubmission {
  id: string;
  typeform_id: string;
  submission_id: string;
  form_data: Record<string, any>;
  submitted_at: string;
  user_email: string | null;
  user_identified: boolean;
  created_at: string;
}

/**
 * Component to display Typeform submissions in the admin dashboard
 */
export const TypeformSubmissionsCard = () => {
  const [submissions, setSubmissions] = useState<TypeformSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  /**
   * Fetch Typeform submissions from database
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching Typeform submissions...');

      const { data, error } = await supabase
        .from('typeform_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching Typeform submissions:', error);
        return;
      }

      console.log('✅ Typeform submissions loaded:', data?.length || 0);
      setSubmissions(data || []);
    } catch (error) {
      console.error('❌ Unexpected error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time subscription for Typeform submissions
   */
  useEffect(() => {
    // Initial load
    fetchSubmissions();

    // Set up real-time subscription
    console.log('🔄 Setting up real-time subscription for Typeform submissions...');
    
    const channel = supabase
      .channel('typeform_submissions_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typeform_submissions'
        },
        (payload) => {
          console.log('📡 Typeform submission real-time update:', payload);
          fetchSubmissions(); // Refresh the list
        }
      )
      .subscribe((status) => {
        console.log('📡 Typeform submissions subscription status:', status);
      });

    return () => {
      console.log('🔚 Cleaning up Typeform submissions subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Toggle expanded view for submission details
   */
  const toggleExpanded = (submissionId: string) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  /**
   * Format form data for display
   */
  const formatFormData = (formData: Record<string, any>) => {
    return Object.entries(formData).map(([key, value]) => (
      <div key={key} className="mb-2">
        <span className="font-medium text-sm text-gray-700">{key}:</span>
        <span className="ml-2 text-sm">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Typeform Submissions
            </CardTitle>
            <CardDescription>
              Recent submissions from YFF Typeform
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSubmissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No Typeform submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {submissions.length} submissions
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                {submissions.filter(s => s.user_identified).length} identified users
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {submission.user_identified ? (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          {submission.user_email || 'Anonymous'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={submission.user_identified ? 'default' : 'outline'}>
                        {submission.user_identified ? 'Registered User' : 'Anonymous'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(submission.id)}
                        >
                          {expandedSubmission === submission.id ? 'Hide' : 'View'} Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://admin.typeform.com/form/${submission.typeform_id}/results#responses`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Expanded submission details */}
            {expandedSubmission && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const submission = submissions.find(s => s.id === expandedSubmission);
                  if (!submission) return null;
                  
                  return (
                    <div>
                      <h4 className="font-medium mb-3">Submission Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Submission ID:</strong> {submission.submission_id}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Form ID:</strong> {submission.typeform_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Processed:</strong> {new Date(submission.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Form Responses:</h5>
                        <div className="bg-white p-3 rounded border">
                          {formatFormData(submission.form_data)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
