
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileSpreadsheet,
  RefreshCw,
  Star,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useGoogleSheetsData } from '@/hooks/useGoogleSheetsData';

/**
 * Component to display feedback and scoring data from Google Sheets
 */
export const GoogleSheetsFeedbackCard = () => {
  const { data, loading, error, refetch } = useGoogleSheetsData();

  /**
   * Get score badge variant based on score value
   */
  const getScoreBadgeVariant = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'outline';
    if (numScore >= 8) return 'default';
    if (numScore >= 6) return 'secondary';
    return 'outline';
  };

  /**
   * Format score for display
   */
  const formatScore = (score: string) => {
    const numScore = parseFloat(score);
    return isNaN(numScore) ? 'N/A' : numScore.toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Feedback & Scoring Data
            </CardTitle>
            <CardDescription>
              Real-time feedback from Google Sheets (syncs every 3 minutes)
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-sm text-red-600 mb-2">Failed to load Google Sheets data</p>
              <p className="text-xs text-gray-500">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading feedback data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No feedback data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                {data.length} feedback entries
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                Avg: {(data.reduce((sum, item) => sum + (parseFloat(item.averageScore) || 0), 0) / data.length).toFixed(1)}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Idea</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={`${row.teamName}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{row.teamName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={row.idea}>
                        {row.idea || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <Badge variant={getScoreBadgeVariant(row.averageScore)}>
                          {formatScore(row.averageScore)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <div className="max-w-md truncate" title={row.feedback}>
                          {row.feedback || 'No feedback yet'}
                        </div>
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
  );
};
