import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, Download, Share2, Trash2, AlertTriangle, Check, FileDown, Printer } from 'lucide-react';
import { Session, SessionTime, TransitAlert, ScheduleChangeNotice } from '../types';
import { exportItineraryToIcs } from '../utils/ical';
import { copyShareableLink } from '../utils/share';
import { getRequiredTransitMinutes } from '../utils/transit';
import { exportItineraryToPdf } from '../utils/pdf';
import { printSchedule } from '../utils/print';

interface ItineraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  transitAlerts: TransitAlert[];
  scheduleChangeNotices?: ScheduleChangeNotice[];
  onRemoveSession: (id: string) => void;
  onClearAll: () => void;
  onSelectSession?: (session: Session) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduledItem {
  session: Session;
  time: SessionTime;
  startMinutes: number;
  endMinutes: number;
}

export const ItineraryDrawer: React.FC<ItineraryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  transitAlerts,
  scheduleChangeNotices = [],
  onRemoveSession,
  onClearAll,
  onSelectSession,
}) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [copied, setCopied] = useState(false);

  // Group all scheduled times by day
  const itemsByDay = useMemo(() => {
    const map: Record<string, ScheduledItem[]> = {};
    for (const d of DAYS) {
      map[d] = [];
    }

    for (const session of sessions) {
      for (const time of session.times) {
        const dayMatch = DAYS.find((d) => (time.day || '').toLowerCase().includes(d.toLowerCase()));
        const targetDay = dayMatch || 'Monday';

        const [startH, startM] = (time.startTime || '00:00').split(':').map(Number);
        const [endH, endM] = (time.endTime || '00:00').split(':').map(Number);

        map[targetDay].push({
          session,
          time,
          startMinutes: (startH || 0) * 60 + (startM || 0),
          endMinutes: (endH || 0) * 60 + (endM || 0),
        });
      }
    }

    // Sort items within each day
    for (const d of DAYS) {
      map[d].sort((a, b) => a.startMinutes - b.startMinutes);
    }

    return map;
  }, [sessions]);

  const activeDayItems = itemsByDay[selectedDay] || [];

  const handleShare = async () => {
    const success = await copyShareableLink(sessions.map((s) => s.id));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExport = () => {
    exportItineraryToIcs(sessions);
  };

  const handleDownloadPdf = () => {
    exportItineraryToPdf(sessions);
  };

  const handlePrint = () => {
    printSchedule();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in transition-colors">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  My Schedule Matrix
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                    {sessions.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time transit verification between conference campuses
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Transit Alert Banner if conflicts exist */}
          {transitAlerts.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-800/60 p-3 px-6 text-xs text-rose-900 dark:text-rose-200 flex items-center space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 animate-pulse" />
              <span>
                <strong>{transitAlerts.length} transit conflict(s)</strong> detected across campuses! Check intervals below.
              </span>
            </div>
          )}

          {/* Day Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/50 px-4 pt-2">
            {DAYS.map((day) => {
              const count = itemsByDay[day]?.length || 0;
              const hasHazard = transitAlerts.some((a) => (a.time1.day || '').includes(day));
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-1 flex-col items-center py-2.5 px-1 text-xs font-medium border-b-2 transition-all ${
                    isSelected
                      ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span className="text-[10px] opacity-75">{count} slots</span>
                  {hasHazard && (
                    <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Chronological Itinerary Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeDayItems.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No sessions scheduled for {selectedDay}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse the catalog and add sessions to your itinerary, or use the Campus Bundler to fill your day.
                </p>
              </div>
            ) : (
              activeDayItems.map((item, index) => {
                const nextItem = activeDayItems[index + 1];
                let transitInfo = null;

                if (nextItem) {
                  const availableMinutes = nextItem.startMinutes - item.endMinutes;
                  const reqMinutes = getRequiredTransitMinutes(item.session.campus, nextItem.session.campus);
                  const isConflict = availableMinutes < reqMinutes;
                  const isSameCampus = item.session.campus === nextItem.session.campus;

                  transitInfo = {
                    availableMinutes,
                    reqMinutes,
                    isConflict,
                    isSameCampus,
                    from: item.session.campus,
                    to: nextItem.session.campus,
                  };
                }

                return (
                  <div key={`${item.session.id}-${item.time.id}-${index}`} className="space-y-3">
                    {/* Session Item Card */}
                    <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                              {item.session.code}
                            </span>
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                              {item.session.type}
                            </span>
                            {scheduleChangeNotices.some((n) => n.sessionId === item.session.id) && (
                              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-300 animate-pulse" title="This session was rescheduled by AWS">
                                Rescheduled by AWS
                              </span>
                            )}
                          </div>
                          <h4
                            onClick={() => onSelectSession?.(item.session)}
                            className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer"
                          >
                            {item.session.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => onRemoveSession(item.session.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition"
                          title="Remove from itinerary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Time & Room */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center space-x-1 font-mono text-amber-700 dark:text-amber-300/90 font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span>
                            {item.time.startTimeFormatted} - {item.time.endTimeFormatted}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 truncate">
                          <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="truncate">{item.time.room || item.session.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Transit connector between consecutive items */}
                    {transitInfo && (
                      <div
                        className={`rounded-lg p-2.5 text-xs border flex items-center justify-between ${
                          transitInfo.isConflict
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                            : transitInfo.isSameCampus
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {transitInfo.isConflict ? (
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 animate-pulse" />
                          ) : transitInfo.isSameCampus ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          )}
                          <span>
                            {transitInfo.isConflict ? (
                              <strong>
                                Transit Hazard: {transitInfo.reqMinutes}m transit needed, only {transitInfo.availableMinutes}m gap!
                              </strong>
                            ) : transitInfo.isSameCampus ? (
                              `Same campus (${transitInfo.from}) • ~10m stroll • ${transitInfo.availableMinutes}m gap`
                            ) : (
                              `Transit: ${transitInfo.from} ➔ ${transitInfo.to} (${transitInfo.reqMinutes}m needed, ${transitInfo.availableMinutes}m gap)`
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-4 sm:px-6 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadPdf}
                disabled={!sessions.length}
                className="flex items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
                title="Download formatted itinerary PDF file"
              >
                <FileDown className="h-4 w-4" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrint}
                disabled={!sessions.length}
                className="flex items-center justify-center space-x-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-50 py-2.5 text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                title="Print clean multi-page schedule matrix"
              >
                <Printer className="h-4 w-4" />
                <span>Print Schedule</span>
              </button>

              <button
                onClick={handleExport}
                disabled={!sessions.length}
                className="flex items-center justify-center space-x-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-300 dark:border-slate-700 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white transition shadow-sm cursor-pointer"
                title="Export to iCalendar (.ics)"
              >
                <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>Export .ics</span>
              </button>

              <button
                onClick={handleShare}
                disabled={!sessions.length}
                className="flex items-center justify-center space-x-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-300 dark:border-slate-700 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white transition shadow-sm cursor-pointer"
                title="Copy shareable link with current schedule"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                <span>{copied ? 'Link Copied!' : 'Share Itinerary'}</span>
              </button>
            </div>

            {sessions.length > 0 && (
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-500">Auto-saved to device</span>
                <button
                  onClick={onClearAll}
                  className="text-rose-600 dark:text-rose-400/80 hover:text-rose-700 dark:hover:text-rose-300 transition font-medium"
                >
                  Clear all sessions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
