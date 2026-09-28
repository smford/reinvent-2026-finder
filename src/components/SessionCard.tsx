import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Session } from '../types';

interface SessionCardProps {
  session: Session;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onSelectSession?: (session: Session) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isBookmarked,
  onToggleBookmark,
  onSelectSession,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Level color mapping
  const levelNum = session.level.split(' ')[0] || '';
  const levelColor =
    levelNum === '100'
      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
      : levelNum === '200'
      ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/30'
      : levelNum === '300'
      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
      : levelNum === '400'
      ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30'
      : levelNum === '500'
      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  // Campus color styling
  const campusColor =
    session.campus.includes('Caesars')
      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
      : session.campus.includes('Venetian')
      ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60'
      : session.campus.includes('Wynn')
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
      : session.campus.includes('MGM')
      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  return (
    <article
      className={`session-card-deferred relative rounded-xl border p-4 sm:p-5 transition-all duration-150 ${
        isBookmarked
          ? 'bg-amber-50/70 dark:bg-slate-900/90 border-amber-400 dark:border-amber-500/50 shadow-md ring-1 ring-amber-400/40 dark:ring-amber-500/30'
          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm dark:hover:bg-slate-900/80'
      }`}
    >
      {/* Top Meta Badges & Bookmark Toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Session Code */}
          <span className="font-mono font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 tracking-wide">
            {session.code || 'SESSION'}
          </span>

          {/* Level Badge */}
          {session.level && (
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${levelColor}`}>
              {session.level.split('-')[0].trim()}
            </span>
          )}

          {/* Session Type */}
          {session.type && (
            <span className="rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {session.type}
            </span>
          )}

          {/* Campus Chip */}
          <span className={`flex items-center space-x-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${campusColor}`}>
            <MapPin className="h-3 w-3" />
            <span>{session.campus}</span>
          </span>
        </div>

        {/* Bookmark Action Button */}
        <button
          onClick={() => onToggleBookmark(session.id)}
          className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
            isBookmarked
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
          title={isBookmarked ? 'Remove from your schedule' : 'Add to your schedule'}
        >
          {isBookmarked ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scheduled</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>

      {/* Session Title */}
      <h3
        onClick={() => onSelectSession?.(session)}
        className="mt-2 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
      >
        {session.title}
      </h3>

      {/* Scheduled Time Slots */}
      {session.times.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {session.times.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-800/80"
            >
              <div className="flex items-center space-x-1 text-amber-700 dark:text-amber-400 font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t.day || t.date}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {t.startTimeFormatted} - {t.endTimeFormatted} ({t.duration}m)
                </span>
              </div>
              {t.room && (
                <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 truncate max-w-full">
                  <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span className="truncate">{t.room}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Abstract Description */}
      {session.abstract && (
        <div className="mt-2.5">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {expanded ? session.abstract : `${session.abstract.slice(0, 190)}...`}
          </p>
          {session.abstract.length > 190 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center space-x-1 text-[11px] font-medium text-amber-600 dark:text-amber-400/90 hover:underline"
            >
              <span>{expanded ? 'Show less' : 'Read full description'}</span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      )}

      {/* Topics & Area of Interest Tags */}
      {(session.topics.length > 0 || session.areasOfInterest.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.topics.map((t) => (
            <span
              key={t}
              className="rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
            >
              {t}
            </span>
          ))}
          {session.areasOfInterest.map((a) => (
            <span
              key={a}
              className="rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 px-2 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
