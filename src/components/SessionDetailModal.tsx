import React from 'react';
import { X, Calendar, Clock, MapPin, ExternalLink, Check, Plus } from 'lucide-react';
import { Session } from '../types';

interface SessionDetailModalProps {
  session: Session | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  if (!session) return null;

  const officialUrl = `https://registration.awsevents.com/flow/awsevents/reinvent2026/eventcatalog/page/eventcatalog?search=${encodeURIComponent(
    session.code || session.title
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-amber-400">{session.code}</span>
              {session.level && (
                <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300 font-medium">
                  {session.level}
                </span>
              )}
              {session.type && (
                <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  {session.type}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1.5 leading-snug">
              {session.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Scheduled Times & Rooms */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-400" />
              Scheduled Times & Locations
            </h3>
            {session.times.length > 0 ? (
              <div className="space-y-2">
                {session.times.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 gap-2"
                  >
                    <div className="flex items-center space-x-2 text-xs text-slate-200">
                      <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="font-semibold text-white">{t.day}:</span>
                      <span>
                        {t.startTimeFormatted} - {t.endTimeFormatted} ({t.duration}m)
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{t.room || session.venue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No scheduled physical time slots published yet.</p>
            )}
          </div>

          {/* Abstract */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Abstract & Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {session.abstract || 'No description provided.'}
            </p>
          </div>

          {/* Taxonomies & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Campus Cluster
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 px-2.5 py-1 rounded-lg">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                {session.campus}
              </span>
            </div>

            {session.roles.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Target Roles
                </span>
                <div className="flex flex-wrap gap-1">
                  {session.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topics & Areas of Interest */}
          {(session.topics.length > 0 || session.areasOfInterest.length > 0) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Topics & Focus Areas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {session.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-800/80 border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {t}
                  </span>
                ))}
                {session.areasOfInterest.map((a) => (
                  <span
                    key={a}
                    className="rounded bg-indigo-950/50 border border-indigo-800/60 px-2.5 py-1 text-xs text-indigo-200"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-4">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
          >
            <span>View on Official AWS Catalog</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Close
            </button>
            <button
              onClick={() => onToggleBookmark(session.id)}
              className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-md ${
                isBookmarked
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              {isBookmarked ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>In Schedule</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add to Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
