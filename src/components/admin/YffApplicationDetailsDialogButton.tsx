
/**
 * @fileoverview Button component for opening YFF Application Details Dialog
 * 
 * Simple button wrapper that manages dialog state and provides consistent
 * styling across the admin interface.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { YffApplicationDetailsDialogEnhanced } from './YffApplicationDetailsDialogEnhanced';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

interface YffApplicationDetailsDialogButtonProps {
  application: YffApplicationWithIndividual;
}

export const YffApplicationDetailsDialogButton: React.FC<YffApplicationDetailsDialogButtonProps> = ({
  application,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-3 w-3 mr-1" />
        View Details
      </Button>
      
      <YffApplicationDetailsDialogEnhanced
        application={application}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
