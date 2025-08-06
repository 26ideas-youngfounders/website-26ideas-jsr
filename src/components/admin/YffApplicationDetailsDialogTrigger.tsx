
/**
 * @fileoverview YFF Application Details Dialog Trigger
 * 
 * Wrapper component that provides a trigger button for the enhanced details dialog.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { YffApplicationDetailsDialogEnhanced } from './YffApplicationDetailsDialogEnhanced';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

interface YffApplicationDetailsDialogTriggerProps {
  application: YffApplicationWithIndividual;
}

/**
 * Trigger component for YFF Application Details Dialog
 */
export const YffApplicationDetailsDialogTrigger: React.FC<YffApplicationDetailsDialogTriggerProps> = ({
  application
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
