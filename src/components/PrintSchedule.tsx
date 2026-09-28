import React, { useMemo } from 'react';
import { Session, SessionTime } from '../types';
import { getRequiredTransitMinutes } from '../utils/transit';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduledItem {
  session: Session;
  time: SessionTime;
  startMinutes: number;
  endMinutes: number;
}

interface PrintScheduleProps {
  sessions: Session[];
}

export const PrintSchedule: React.FC<PrintScheduleProps> = ({ sessions }) => {
  const { itemsByDay, unscheduledSessions } = useMemo(() => {
    const map: Record<string, ScheduledItem[]> = {};
    for (const d of DAYS) {
      map[d] = [];
    }
    const unscheduled: Session[] = [];

    for (const session of sessions) {
      if (!session.times || session.times.length === 0) {
        unscheduled.push(session);
        continue;
      }

      let matched = false;
      for (const time of session.times) {
        const dayMatch = DAYS.find((d) => (time.day || '').toLowerCase().includes(d.toLowerCase()));
        if (dayMatch) {
          matched = true;
          const [startH, startM] = (time.startTime || '00:00').split(':').map(Number);
          const [endH, endM] = (time.endTime || '00:00').split(':').map(Number);

          map[dayMatch].push({
            session,
            time,
            startMinutes: (startH || 0) * 60 + (startM || 0),
            endMinutes: (endH || 0) * 60 + (endM || 0),
          });
        }
      }

      if (!matched) {
        unscheduled.push(session);
      }
    }

    // Sort items chronologically within each day
    for (const d of DAYS) {
      map[d].sort((a, b) => a.startMinutes - b.startMinutes);
    }

    return { itemsByDay: map, unscheduledSessions: unscheduled };
  }, [sessions]);

  if (!sessions || sessions.length === 0) {
    return (
      <div id="printable-schedule" className="hidden print:block p-8 text-center bg-white text-slate-900">
        <h1 className="text-xl font-bold">AWS re:Invent 2026 Schedule</h1>
        <p className="mt-2 text-sm text-slate-600">No sessions currently in your schedule.</p>
        <p className="text-xs text-slate-400 mt-1">Visit https://stephenford.org/reinvent-2026-finder/ to plan your itinerary.</p>
      </div>
    );
  }

  const generatedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div id="printable-schedule" className="hidden print:block font-sans text-slate-900 bg-white p-4">
      {/* Document Header */}
      <div className="border-b-2 border-slate-900 pb-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              AWS re:Invent 2026 — Schedule Matrix
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Personalized Conference Itinerary & Transit Verification • Generated on {generatedDate}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100">
              {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'} Total
            </span>
            <p className="text-[10px] text-slate-500 mt-1">stephenford.org/reinvent-2026-finder</p>
          </div>
        </div>
      </div>

      {/* Days Loop */}
      <div className="space-y-6">
        {DAYS.map((day) => {
          const items = itemsByDay[day];
          if (!items || items.length === 0) return null;

          return (
            <div key={day} className="space-y-3" style={{ breakInside: 'auto' }}>
              {/* Day Header */}
              <div
                className="bg-slate-900 text-white px-3 py-1.5 rounded flex items-center justify-between"
                style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
              >
                <h2 className="text-sm font-bold tracking-wide uppercase">{day}</h2>
                <span className="text-xs text-amber-400 font-medium">
                  {items.length} {items.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>

              {/* Day Sessions List */}
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const nextItem = items[idx + 1];
                  let transit = null;

                  if (nextItem) {
                    const availableMinutes = nextItem.startMinutes - item.endMinutes;
                    const reqMinutes = getRequiredTransitMinutes(item.session.campus, nextItem.session.campus);
                    const isConflict = availableMinutes < reqMinutes;
                    const isSameCampus = item.session.campus === nextItem.session.campus;
                    transit = {
                      availableMinutes,
                      reqMinutes,
                      isConflict,
                      isSameCampus,
                      from: item.session.campus,
                      to: nextItem.session.campus,
                    };
                  }

                  return (
                    <div
                      key={`${item.session.id}-${item.time.id}-${idx}`}
                      className="space-y-2"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      {/* Session Box */}
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex gap-4">
                        {/* Time & Duration */}
                        <div className="w-36 flex-shrink-0 border-r border-slate-200 pr-3">
                          <div className="font-mono font-bold text-xs text-slate-900">
                            {item.time.startTimeFormatted || item.time.startTime}
                          </div>
                          <div className="font-mono text-[11px] text-slate-600">
                            to {item.time.endTimeFormatted || item.time.endTime}
                          </div>
                          {item.time.duration && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              {item.time.duration} minutes
                            </div>
                          )}
                        </div>

                        {/* Session Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-mono font-bold text-amber-700">
                              {item.session.code}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-medium">{item.session.type}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">{item.session.level}</span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                            {item.session.title}
                          </h3>

                          <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-700">
                            <span className="font-semibold">{item.session.campus}</span>
                            <span>—</span>
                            <span>{item.time.room || item.session.venue}</span>
                          </div>

                          {item.session.abstract && (
                            <p className="mt-1 text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                              {item.session.abstract}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Transit Connector between consecutive sessions */}
                      {transit && (
                        <div
                          className={`text-[11px] px-3 py-1.5 rounded border flex items-center justify-between ${
                            transit.isConflict
                              ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                              : transit.isSameCampus
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                        >
                          <div>
                            {transit.isConflict ? (
                              <span>
                                ⚠️ TRANSIT HAZARD: {transit.reqMinutes}m transit needed ({transit.from} ➔ {transit.to}), only {transit.availableMinutes}m available!
                              </span>
                            ) : transit.isSameCampus ? (
                              <span>
                                ✓ Same campus ({transit.from}) • ~10m walk • {transit.availableMinutes}m gap buffer
                              </span>
                            ) : (
                              <span>
                                ➔ Transit: {transit.from} to {transit.to} ({transit.reqMinutes}m required • {transit.availableMinutes}m gap)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Unscheduled Sessions */}
        {unscheduledSessions.length > 0 && (
          <div className="space-y-3 pt-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="bg-slate-700 text-white px-3 py-1.5 rounded flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wide uppercase">Unscheduled / Flexible Sessions</h2>
              <span className="text-xs text-slate-300">{unscheduledSessions.length} sessions</span>
            </div>
            <div className="border border-slate-300 rounded-lg divide-y divide-slate-200">
              {unscheduledSessions.map((session) => (
                <div key={session.id} className="p-2.5 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-700">{session.code}</span>
                      <span className="font-semibold text-slate-900">{session.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {session.campus} • {session.venue} • {session.level} • {session.type}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    Schedule TBD
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer on print */}
      <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
        <span>AWS re:Invent 2026 Schedule Matrix</span>
        <span>Generated with re:Invent Transit Bundler (stephenford.org/reinvent-2026-finder)</span>
      </div>
    </div>
  );
};
