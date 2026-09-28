import React, { useState } from 'react';
import { Calendar, Compass, Share2, Download, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { Session, TransitAlert } from '../types';
import { exportItineraryToIcs } from '../utils/ical';
import { copyShareableLink } from '../utils/share';

interface HeaderProps {
  totalSessions: number;
  bookmarkedSessions: Session[];
  transitAlerts: TransitAlert[];
  onOpenItinerary: () => void;
  onOpenBundler: () => void;
  onRefreshLive: () => void;
  isRefreshingLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalSessions,
  bookmarkedSessions,
  transitAlerts,
  onOpenItinerary,
  onOpenBundler,
  onRefreshLive,
  isRefreshingLive,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const success = await copyShareableLink(bookmarkedSessions.map((s) => s.id));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExport = () => {
    if (!bookmarkedSessions.length) {
      alert('Your itinerary is empty. Bookmark some sessions first to export your schedule!');
      return;
    }
    exportItineraryToIcs(bookmarkedSessions);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Event Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-orange-500/20 font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white sm:text-lg">
                re:Invent 2026
              </span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                Transit Bundler
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              {totalSessions ? `${totalSessions.toLocaleString()} sessions indexed` : 'Loading catalog...'} • Las Vegas, NV
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Campus Bundler Tool Button */}
          <button
            onClick={onOpenBundler}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs sm:text-sm font-medium text-indigo-300 transition-colors shadow-sm"
            title="Automatically bundle sessions by physical campus to eliminate Strip transit"
          >
            <Compass className="h-4 w-4 text-indigo-400" />
            <span className="hidden md:inline">Campus Bundler</span>
            <span className="md:hidden">Bundler</span>
          </button>

          {/* Share Itinerary Button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
            title="Copy shareable link with current itinerary"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-slate-300" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Export to .ics Button */}
          <button
            onClick={handleExport}
            disabled={!bookmarkedSessions.length}
            className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none border border-slate-700 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
            title="Export itinerary to iCalendar (.ics)"
          >
            <Download className="h-4 w-4 text-slate-300" />
            <span>.ics</span>
          </button>

          {/* My Itinerary Drawer Toggle */}
          <button
            onClick={onOpenItinerary}
            className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 transition hover:brightness-110 shadow-md shadow-amber-500/20"
          >
            <Calendar className="h-4 w-4" />
            <span>My Schedule</span>
            {bookmarkedSessions.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-950 px-1.5 py-0.2 text-[11px] font-bold text-amber-300">
                {bookmarkedSessions.length}
              </span>
            )}
            {transitAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white animate-pulse" title={`${transitAlerts.length} transit conflict(s) detected!`}>
                <AlertTriangle className="h-2.5 w-2.5" />
              </span>
            )}
          </button>

          {/* Live Sync Button */}
          <button
            onClick={onRefreshLive}
            disabled={isRefreshingLive}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Check live catalog on AWS RainFocus API"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingLive ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
