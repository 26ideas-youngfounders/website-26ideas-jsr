
import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface YffAutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

/**
 * Autosave status indicator component
 * Shows current autosave status with appropriate icons and messages
 */
export const YffAutosaveIndicator: React.FC<YffAutosaveIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Saving...',
          className: 'text-blue-600 bg-blue-50',
        };
      case 'saved':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'All changes saved',
          className: 'text-green-600 bg-green-50',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Save failed',
          className: 'text-red-600 bg-red-50',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border flex items-center gap-2 ${config.className} transition-all duration-200`}>
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};
