import React, { useState } from 'react';
import { Calendar, Compass, Share2, Download, RefreshCw, AlertTriangle, Check, Sun, Moon, ArrowDownToLine, FileDown, Printer } from 'lucide-react';
import { Session, TransitAlert } from '../types';
import { exportItineraryToIcs } from '../utils/ical';
import { copyShareableLink } from '../utils/share';
import { exportItineraryToPdf } from '../utils/pdf';
import { printSchedule } from '../utils/print';

interface HeaderProps {
  totalSessions: number;
  bookmarkedSessions: Session[];
  transitAlerts: TransitAlert[];
  onOpenItinerary: () => void;
  onOpenBundler: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUpdatePWA: () => void;
  isUpdatingPWA: boolean;
  updateAvailable: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  canIncreaseTextSize: boolean;
  canDecreaseTextSize: boolean;
  textSizeLabel: string;
  isDefaultTextSize: boolean;
  onIncreaseTextSize: () => void;
  onDecreaseTextSize: () => void;
  onResetTextSize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalSessions,
  bookmarkedSessions,
  transitAlerts,
  onOpenItinerary,
  onOpenBundler,
  theme,
  onToggleTheme,
  onUpdatePWA,
  isUpdatingPWA,
  updateAvailable,
  isOnline,
  lastSyncTime,
  canIncreaseTextSize,
  canDecreaseTextSize,
  textSizeLabel,
  isDefaultTextSize,
  onIncreaseTextSize,
  onDecreaseTextSize,
  onResetTextSize,
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
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md transition-colors w-full overflow-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Brand & Event Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-orange-500/20 border border-slate-700/40 bg-slate-900 flex-shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="re:Invent 2026 Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg truncate">
                re:Invent 2026
              </span>
              <span className="hidden sm:inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                Transit Bundler
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block truncate">
              {totalSessions ? `${totalSessions.toLocaleString()} sessions indexed` : 'Loading catalog...'} • Las Vegas, NV
              {lastSyncTime && (
                <span className="ml-1 opacity-75">• Synced {lastSyncTime}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* PWA Update / Sync Button */}
          <button
            onClick={onUpdatePWA}
            disabled={isUpdatingPWA || !isOnline}
            className={`relative flex items-center space-x-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border shadow-sm ${
              updateAvailable
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 ring-2 ring-emerald-500/40'
                : isOnline
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                : 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title={
              !isOnline
                ? 'Offline: connect to internet to update'
                : updateAvailable
                ? 'New update available! Click to update app'
                : lastSyncTime
                ? `Update catalog & app (Last sync: ${lastSyncTime})`
                : 'Update catalog & app'
            }
          >
            {updateAvailable ? (
              <ArrowDownToLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            ) : (
              <RefreshCw className={`h-4 w-4 ${isUpdatingPWA ? 'animate-spin text-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
            )}
            <span className="hidden md:inline font-semibold">
              {isUpdatingPWA ? 'Updating...' : updateAvailable ? 'Update App' : 'Update'}
            </span>
            {updateAvailable && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </button>

          {/* Campus Bundler Tool Button (hidden on mobile, accessible via hero banner and drawer) */}
          <button
            onClick={onOpenBundler}
            className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300 transition-colors shadow-sm"
            title="Automatically bundle sessions by physical campus to eliminate Strip transit"
          >
            <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">Campus Bundler</span>
            <span className="lg:hidden">Bundler</span>
          </button>

          {/* Share Itinerary Button (hidden on mobile, accessible via drawer and shared banner) */}
          <button
            onClick={handleShare}
            className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
            title="Copy shareable link with current itinerary"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Print Schedule Button */}
          <button
            onClick={() => {
              if (!bookmarkedSessions.length) {
                alert('Your itinerary is empty. Bookmark some sessions first to print your schedule!');
                return;
              }
              printSchedule();
            }}
            disabled={!bookmarkedSessions.length}
            className="hidden xl:flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Print schedule matrix"
          >
            <Printer className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            <span>Print</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={() => {
              if (!bookmarkedSessions.length) {
                alert('Your itinerary is empty. Bookmark some sessions first to download as PDF!');
                return;
              }
              exportItineraryToPdf(bookmarkedSessions);
            }}
            disabled={!bookmarkedSessions.length}
            className="hidden lg:flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Download itinerary PDF"
          >
            <FileDown className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            <span>PDF</span>
          </button>

          {/* Export to .ics Button */}
          <button
            onClick={handleExport}
            disabled={!bookmarkedSessions.length}
            className="hidden md:flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Export itinerary to iCalendar (.ics)"
          >
            <Download className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            <span>.ics</span>
          </button>

          {/* My Itinerary Drawer Toggle */}
          <button
            onClick={onOpenItinerary}
            className="relative flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 transition hover:brightness-110 shadow-md shadow-amber-500/20 flex-shrink-0 cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
            {bookmarkedSessions.length > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-950 px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold text-amber-300">
                {bookmarkedSessions.length}
              </span>
            )}
            {transitAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white animate-pulse" title={`${transitAlerts.length} transit conflict(s) detected!`}>
                <AlertTriangle className="h-2.5 w-2.5" />
              </span>
            )}
          </button>

          {/* Text Size Controls */}
          <div
            className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0"
            title={`Font size: ${textSizeLabel}`}
          >
            <button
              onClick={onDecreaseTextSize}
              disabled={!canDecreaseTextSize}
              className="flex items-center justify-center p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              <span className="text-[11px] font-bold leading-none select-none">A</span>
            </button>
            {/* Centre dot — lights up when non-default; click to reset */}
            <button
              onClick={isDefaultTextSize ? undefined : onResetTextSize}
              className={`flex items-center justify-center w-5 h-full transition border-x border-slate-200 dark:border-slate-700 ${
                isDefaultTextSize
                  ? 'cursor-default'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
              }`}
              title={isDefaultTextSize ? 'Default font size' : `Reset to default (currently: ${textSizeLabel})`}
              aria-label={isDefaultTextSize ? 'Default font size' : 'Reset font size to default'}
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-colors ${
                  isDefaultTextSize
                    ? 'bg-slate-300 dark:bg-slate-600'
                    : 'bg-amber-500 dark:bg-amber-400'
                }`}
              />
            </button>
            <button
              onClick={onIncreaseTextSize}
              disabled={!canIncreaseTextSize}
              className="flex items-center justify-center p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Increase font size"
              aria-label="Increase font size"
            >
              <span className="text-[15px] font-bold leading-none select-none">A</span>
            </button>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
