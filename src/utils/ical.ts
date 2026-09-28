import { Session } from '../types';

/**
 * Clean text strings for iCalendar format (escaping commas, semicolons, backslashes).
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Format date & time into iCalendar string YYYYMMDDTHHMMSS
 */
function formatIcsDateTime(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:MM
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = (timeStr.replace(/:/g, '') + '00').padEnd(6, '0').slice(0, 6);
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Generates an RFC 5545 compliant iCalendar string and triggers a file download.
 */
export function exportItineraryToIcs(sessions: Session[], filename = 'reinvent-2026-schedule.ics'): void {
  const events: string[] = [];
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const session of sessions) {
    for (const time of session.times) {
      if (!time.date || !time.startTime || !time.endTime) continue;

      const dtStart = formatIcsDateTime(time.date, time.startTime);
      const dtEnd = formatIcsDateTime(time.date, time.endTime);
      const uid = `${session.id}-${time.id || time.date + time.startTime}@reinvent2026`;
      const summary = escapeIcsText(`[${session.code || 'AWS'}] ${session.title}`);
      const location = escapeIcsText(time.room || time.venue || session.venue);
      
      const descriptionLines = [
        session.title,
        `Type: ${session.type}`,
        `Level: ${session.level || 'N/A'}`,
        session.campus ? `Campus: ${session.campus}` : '',
        session.topics.length ? `Topics: ${session.topics.join(', ')}` : '',
        '',
        session.abstract,
        '',
        `Official Catalog: https://registration.awsevents.com/flow/awsevents/reinvent2026/eventcatalog/page/eventcatalog`
      ].filter(Boolean);

      const description = escapeIcsText(descriptionLines.join('\n'));

      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${now}`,
          `DTSTART;TZID=America/Los_Angeles:${dtStart}`,
          `DTEND;TZID=America/Los_Angeles:${dtEnd}`,
          `SUMMARY:${summary}`,
          `LOCATION:${location}`,
          `DESCRIPTION:${description}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n')
      );
    }
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AWS re:Invent 2026 Schedule Bundler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AWS re:Invent 2026 Schedule',
    'X-WR-TIMEZONE:America/Los_Angeles',
    // VTIMEZONE for America/Los_Angeles
    'BEGIN:VTIMEZONE',
    'TZID:America/Los_Angeles',
    'X-LIC-LOCATION:America/Los_Angeles',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0700',
    'TZOFFSETTO:-0800',
    'TZNAME:PST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0800',
    'TZOFFSETTO:-0700',
    'TZNAME:PDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
