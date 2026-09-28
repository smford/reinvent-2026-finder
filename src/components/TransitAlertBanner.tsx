import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { TransitAlert } from '../types';

interface TransitAlertBannerProps {
  alerts: TransitAlert[];
  onDismissAlert?: (id: string) => void;
  onOpenItinerary: () => void;
}

export const TransitAlertBanner: React.FC<TransitAlertBannerProps> = ({
  alerts,
  onOpenItinerary,
}) => {
  if (!alerts.length) return null;

  const firstAlert = alerts[0];

  return (
    <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800/80 px-4 py-3 text-rose-900 dark:text-rose-200 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="flex-shrink-0 mt-0.5 sm:mt-0 rounded-md bg-rose-100 dark:bg-rose-900/60 p-1.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-rose-950 dark:text-rose-100 text-sm">
                Transit Conflict Detected ({alerts.length} hazard{alerts.length > 1 ? 's' : ''})
              </span>
              <span className="rounded bg-rose-100 dark:bg-rose-900/80 px-1.5 py-0.5 text-[11px] font-mono font-medium text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Needs {firstAlert.transitRequiredMinutes}m transit, only {firstAlert.availableMinutes}m gap
              </span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300/90 mt-0.5">
              <strong className="font-medium text-rose-950 dark:text-white">[{firstAlert.session1.code}]</strong> at {firstAlert.fromCampus} ends at {firstAlert.time1.endTimeFormatted}, but{' '}
              <strong className="font-medium text-rose-950 dark:text-white">[{firstAlert.session2.code}]</strong> at {firstAlert.toCampus} starts at {firstAlert.time2.startTimeFormatted} ({firstAlert.time1.day}).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 pl-8 sm:pl-0">
          <button
            onClick={onOpenItinerary}
            className="flex items-center space-x-1 rounded-md bg-rose-600 hover:bg-rose-700 dark:bg-rose-900/70 dark:hover:bg-rose-800 border border-rose-600 dark:border-rose-700/60 px-3 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <span>Resolve in Schedule</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
