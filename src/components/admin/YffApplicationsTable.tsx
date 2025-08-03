/**
 * @fileoverview YFF Applications Admin Table
 * 
 * Displays YFF applications in a comprehensive table format with sorting,
 * filtering, and evaluation capabilities.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Filter, 
  Download, 
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { YffApplicationEvaluationDialog } from './YffApplicationEvaluationDialog';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { 
  parseApplicationAnswers, 
  parseEvaluationData,
  getDisplayScore,
  isApplicationEvaluated
} from '@/types/yff-application';
import { YffApplicationsTableEnhanced } from './YffApplicationsTableEnhanced';

export interface YffApplicationsTableProps {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
}

/**
 * @deprecated Use YffApplicationsTableEnhanced instead
 * This component is maintained for backward compatibility
 */
export const YffApplicationsTable: React.FC<YffApplicationsTableProps> = (props) => {
  // For now, just forward to the enhanced version
  // In the future, this can be removed entirely
  return <YffApplicationsTableEnhanced {...props} />;
};
