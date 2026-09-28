import React, { useState } from 'react';
import { AlertCircle, Calendar, ChevronDown, ChevronUp, X, Clock } from 'lucide-react';
import { ScheduleChangeNotice } from '../types';

interface ScheduleChangeBannerProps {
  notices: ScheduleChangeNotice[];
  onDismissNotice: (id: string) => void;
  onClearAllNotices: () => void;
  onOpenItinerary: () => void;
}

export const ScheduleChangeBanner: React.FC<ScheduleChangeBannerProps> = ({
  notices,
  onDismissNotice,
  onClearAllNotices,
  onOpenItinerary,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!notices || notices.length === 0) return null;

  return (
    <div className="border-b border-amber-300 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/60 dark:via-orange-950/40 dark:to-amber-950/60 py-3 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header & Title */}
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule Notice: AWS Updated {notices.length} Bookmarked Session{notices.length === 1 ? '' : 's'}
                </h3>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  Rescheduled by AWS
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                The session catalog sync detected time or location adjustments made to your scheduled items.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded transition"
            >
              <span>{isExpanded ? 'Hide Details' : 'View Changes'}</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <button
              onClick={onOpenItinerary}
              className="flex items-center space-x-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 text-xs transition shadow-sm cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Review Itinerary</span>
            </button>

            <button
              onClick={onClearAllNotices}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded transition"
              title="Dismiss all notices"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded Details List */}
        {isExpanded && (
          <div className="mt-3 space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 text-xs shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {notice.code}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {notice.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {notice.changeType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 line-through">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Was: {notice.oldSummary}</span>
                    </div>
                    <span className="text-amber-600 font-bold">➔</span>
                    <div className="flex items-center space-x-1 text-slate-900 dark:text-white font-medium">
                      <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <span>Now: {notice.newSummary}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDismissNotice(notice.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
                  title="Dismiss this notice"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
