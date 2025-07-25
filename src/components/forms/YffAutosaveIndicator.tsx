
import React from 'react';
import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';

interface YffAutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'loading';
}

/**
 * Enhanced autosave status indicator component
 * Shows current autosave status with appropriate icons and messages
 */
export const YffAutosaveIndicator: React.FC<YffAutosaveIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Loading saved progress...',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'saving':
        return {
          icon: <Cloud className="w-4 h-4 animate-pulse" />,
          text: 'Saving progress...',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'saved':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'All changes saved',
          className: 'text-green-600 bg-green-50 border-green-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Auto-save failed - your data is still preserved',
          className: 'text-red-600 bg-red-50 border-red-200',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border flex items-center gap-2 ${config.className} transition-all duration-300 shadow-lg`}>
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};
