import { Session, SessionTime, TransitAlert } from '../types';

/**
 * Transit time matrix between re:Invent campus clusters in Las Vegas (in minutes).
 * Accounts for casino navigation, shuttle queue/transit, or walking the Strip.
 */
const TRANSIT_MATRIX: Record<string, Record<string, number>> = {
  'Venetian Campus': {
    'Venetian Campus': 10,
    'Wynn Campus': 15,
    'Caesars Campus': 20,
    'MGM Grand Campus': 50,
    'Mandalay Bay Campus': 60,
  },
  'Wynn Campus': {
    'Venetian Campus': 15,
    'Wynn Campus': 10,
    'Caesars Campus': 25,
    'MGM Grand Campus': 55,
    'Mandalay Bay Campus': 60,
  },
  'Caesars Campus': {
    'Venetian Campus': 20,
    'Wynn Campus': 25,
    'Caesars Campus': 10,
    'MGM Grand Campus': 40,
    'Mandalay Bay Campus': 50,
  },
  'MGM Grand Campus': {
    'Venetian Campus': 50,
    'Wynn Campus': 55,
    'Caesars Campus': 40,
    'MGM Grand Campus': 10,
    'Mandalay Bay Campus': 25,
  },
  'Mandalay Bay Campus': {
    'Venetian Campus': 60,
    'Wynn Campus': 60,
    'Caesars Campus': 50,
    'MGM Grand Campus': 25,
    'Mandalay Bay Campus': 10,
  },
};

export function getRequiredTransitMinutes(fromCampus: string, toCampus: string): number {
  if (!fromCampus || !toCampus || fromCampus === toCampus) {
    return 10;
  }
  const fromRecord = TRANSIT_MATRIX[fromCampus];
  if (fromRecord && fromRecord[toCampus]) {
    return fromRecord[toCampus];
  }
  const toRecord = TRANSIT_MATRIX[toCampus];
  if (toRecord && toRecord[fromCampus]) {
    return toRecord[fromCampus];
  }
  return 45; // Default safe estimate between arbitrary venues
}

function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

interface ScheduledOccurrence {
  session: Session;
  time: SessionTime;
  startMinutes: number;
  endMinutes: number;
}

/**
 * Checks an array of bookmarked/scheduled sessions for any physical transit conflicts.
 */
export function detectTransitAlerts(sessions: Session[]): TransitAlert[] {
  const alerts: TransitAlert[] = [];

  // Group scheduled slots by date
  const byDate: Record<string, ScheduledOccurrence[]> = {};

  for (const session of sessions) {
    for (const time of session.times) {
      if (!time.date || !time.startTime || !time.endTime) continue;

      if (!byDate[time.date]) {
        byDate[time.date] = [];
      }

      byDate[time.date].push({
        session,
        time,
        startMinutes: timeStringToMinutes(time.startTime),
        endMinutes: timeStringToMinutes(time.endTime),
      });
    }
  }

  // For each date, sort chronologically and check gaps between consecutive sessions
  for (const date in byDate) {
    const slots = byDate[date];
    // Sort by start time
    slots.sort((a, b) => a.startMinutes - b.startMinutes);

    for (let i = 0; i < slots.length - 1; i++) {
      const first = slots[i];
      const second = slots[i + 1];

      // Overlap or back-to-back
      const availableMinutes = second.startMinutes - first.endMinutes;
      const campus1 = first.session.campus;
      const campus2 = second.session.campus;

      const requiredMinutes = getRequiredTransitMinutes(campus1, campus2);

      // If available window is less than required transit time
      if (availableMinutes < requiredMinutes) {
        alerts.push({
          id: `${first.session.id}-${second.session.id}-${date}`,
          session1: first.session,
          time1: first.time,
          session2: second.session,
          time2: second.time,
          transitRequiredMinutes: requiredMinutes,
          availableMinutes: Math.max(0, availableMinutes),
          deficitMinutes: requiredMinutes - availableMinutes,
          fromCampus: campus1,
          toCampus: campus2,
        });
      }
    }
  }

  return alerts;
}
