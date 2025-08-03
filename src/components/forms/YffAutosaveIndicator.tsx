
/**
 * @fileoverview YFF Autosave Indicator Component
 * 
 * Visual indicator showing autosave status and last saved time
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { AutosaveStatus } from '@/types/autosave';

export interface YffAutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSaved: Date;
  isSaving: boolean;
  className?: string;
}

export const YffAutosaveIndicator: React.FC<YffAutosaveIndicatorProps> = ({
  status,
  lastSaved,
  isSaving,
  className
}) => {
  const getStatusDisplay = () => {
    if (isSaving || status === 'saving') {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Saving...',
        color: 'text-blue-600'
      };
    }

    switch (status) {
      case 'saved':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: `Saved ${lastSaved.toLocaleTimeString()}`,
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Save failed',
          color: 'text-red-600'
        };
      case 'conflict':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Save conflict',
          color: 'text-orange-600'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Draft',
          color: 'text-gray-500'
        };
    }
  };

  const { icon, text, color } = getStatusDisplay();

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      color,
      className
    )}>
      {icon}
      <span>{text}</span>
    </div>
  );
};
