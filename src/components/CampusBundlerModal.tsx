import React, { useState, useMemo } from 'react';
import { X, Compass, MapPin, Calendar, Clock, Sparkles, Check, Plus } from 'lucide-react';
import { Session } from '../types';

interface CampusBundlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  bookmarkedIds: Set<string>;
  onAddMultipleBookmarks: (ids: string[]) => void;
  onApplyFilters: (day: string, campus: string) => void;
}

const CAMPUSES = [
  { name: 'Caesars Campus', venues: 'Caesars Palace & Caesars Forum', desc: 'Central Strip hub • 644 sessions' },
  { name: 'MGM Grand Campus', venues: 'MGM Grand', desc: 'South Strip powerhouse • 607 sessions' },
  { name: 'Wynn Campus', venues: 'Wynn & Encore', desc: 'Luxury North hub • 523 sessions' },
  { name: 'Venetian Campus', venues: 'Venetian / Palazzo / Sands', desc: 'Heart of re:Invent • 224 sessions' },
];

const DAYS = [
  { id: 'Monday', label: 'Mon, Nov 30' },
  { id: 'Tuesday', label: 'Tue, Dec 01' },
  { id: 'Wednesday', label: 'Wed, Dec 02' },
  { id: 'Thursday', label: 'Thu, Dec 03' },
  { id: 'Friday', label: 'Fri, Dec 04' },
];

export const CampusBundlerModal: React.FC<CampusBundlerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  bookmarkedIds,
  onAddMultipleBookmarks,
  onApplyFilters,
}) => {
  const [selectedCampus, setSelectedCampus] = useState('Caesars Campus');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Compute available topics for this day and campus
  const matchingSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.campus !== selectedCampus) return false;
      const matchesDay = s.times.some((t) => t.day.toLowerCase().includes(selectedDay.toLowerCase()));
      if (!matchesDay) return false;
      if (selectedTopic !== 'All' && !s.topics.includes(selectedTopic)) return false;
      return true;
    });
  }, [sessions, selectedCampus, selectedDay, selectedTopic]);

  // Extract unique topics in current selection
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    sessions
      .filter((s) => s.campus === selectedCampus)
      .forEach((s) => s.topics.forEach((t) => set.add(t)));
    return ['All', ...Array.from(set).sort()];
  }, [sessions, selectedCampus]);

  if (!isOpen) return null;

  const handleBundleAll = () => {
    const ids = matchingSessions.map((s) => s.id);
    onAddMultipleBookmarks(ids);
  };

  const handleFilterCatalog = () => {
    onApplyFilters(selectedDay, selectedCampus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 transition-colors">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Campus Day Bundler
                <span className="text-xs bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  Zero Transit Commute
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Eliminate 45-60 min Strip shuttles by grouping your schedule in one physical venue cluster.
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

        {/* Content Controls */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 1. Day Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Calendar className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              1. Choose Day
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium border text-center transition-all ${
                    selectedDay === d.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Campus Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              2. Choose Target Campus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CAMPUSES.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setSelectedCampus(c.name)}
                  className={`cursor-pointer rounded-xl p-3 border transition-all ${
                    selectedCampus === c.name
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{c.name}</span>
                    {selectedCampus === c.name && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-0.5">{c.venues}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Topic Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                3. Optional Topic Focus
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Found <strong className="text-slate-900 dark:text-white font-bold">{matchingSessions.length}</strong> sessions
              </span>
            </div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Session List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Preview Sessions at {selectedCampus} on {selectedDay}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {matchingSessions.slice(0, 10).map((s) => {
                const isBookmarked = bookmarkedIds.has(s.id);
                const time = s.times.find((t) => t.day.toLowerCase().includes(selectedDay.toLowerCase()));
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-2.5 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{s.code}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-800 dark:text-slate-300 truncate font-medium">{s.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <span>{time ? `${time.startTimeFormatted} - ${time.endTimeFormatted}` : 'Scheduled'}</span>
                        <span>•</span>
                        <span className="truncate">{time?.room || s.venue}</span>
                      </div>
                    </div>
                    {isBookmarked ? (
                      <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> In Itinerary
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-slate-500 dark:text-slate-400 text-[11px]">Ready to bundle</span>
                    )}
                  </div>
                );
              })}
              {matchingSessions.length > 10 && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                  + {matchingSessions.length - 10} more sessions in this bundle
                </p>
              )}
              {matchingSessions.length === 0 && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-6">
                  No sessions found matching this campus, day, and topic combination. Try selecting a different topic or campus.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-6 py-4">
          <button
            onClick={handleFilterCatalog}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline font-medium"
          >
            Filter main catalog to this campus & day
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleBundleAll}
              disabled={!matchingSessions.length}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Bundle All ({matchingSessions.length} Sessions)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
