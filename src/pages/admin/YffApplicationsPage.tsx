import React from 'react';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from '@tanstack/react-query';
import { fetchYffApplications } from '@/api/supabase/yff-applications';
import { ExtendedYffApplication } from '@/types/yff-application';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, FileText, User, Mail, Phone, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CanonicalQuestionnaireDisplay } from '@/components/admin/CanonicalQuestionnaireDisplay';

const YffApplicationsPage: React.FC = () => {
  const [selectedApplication, setSelectedApplication] = useState<ExtendedYffApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: applications, isLoading, isError, error } = useQuery<ExtendedYffApplication[]>({
    queryKey: ['yffApplications'],
    queryFn: fetchYffApplications,
  });

  useEffect(() => {
    if (isDialogOpen && !selectedApplication) {
      setIsDialogOpen(false);
    }
  }, [selectedApplication, isDialogOpen]);

  const handleApplicationSelect = (application: ExtendedYffApplication) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedApplication(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">YFF Applications</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-4 animate-pulse">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load applications'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">YFF Applications</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Applicant</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Application ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications?.map((application) => (
            <TableRow key={application.application_id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${application.individuals?.first_name} ${application.individuals?.last_name}.png`} />
                    <AvatarFallback>{application.individuals?.first_name?.[0]}{application.individuals?.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span>{application.individuals?.first_name} {application.individuals?.last_name}</span>
                </div>
              </TableCell>
              <TableCell>{application.individuals?.email}</TableCell>
              <TableCell>{application.application_id}</TableCell>
              <TableCell>
                <Badge variant="outline">{application.evaluation_status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleApplicationSelect(application)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Application
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details: {selectedApplication?.individuals?.first_name} {selectedApplication?.individuals?.last_name}
              <Badge variant="secondary" className="ml-2">
                ID: {selectedApplication?.application_id.slice(0, 8)}...
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {selectedApplication && (
              <CanonicalQuestionnaireDisplay application={selectedApplication} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YffApplicationsPage;
