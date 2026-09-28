import { Session, SessionTime } from '../types';
import { getRequiredTransitMinutes } from './transit';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduledItem {
  session: Session;
  time: SessionTime;
  startMinutes: number;
  endMinutes: number;
}

export async function exportItineraryToPdf(sessions: Session[]): Promise<void> {
  if (!sessions || sessions.length === 0) {
    alert('Your itinerary is empty. Bookmark some sessions before exporting to PDF!');
    return;
  }

  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 16;

  let currentY = 16;

  // Group items by day
  const itemsByDay: Record<string, ScheduledItem[]> = {};
  for (const d of DAYS) {
    itemsByDay[d] = [];
  }
  const unscheduledSessions: Session[] = [];

  for (const session of sessions) {
    if (!session.times || session.times.length === 0) {
      unscheduledSessions.push(session);
      continue;
    }

    let hasMatchedDay = false;
    for (const time of session.times) {
      const dayMatch = DAYS.find((d) => (time.day || '').toLowerCase().includes(d.toLowerCase()));
      if (dayMatch) {
        hasMatchedDay = true;
        const [startH, startM] = (time.startTime || '00:00').split(':').map(Number);
        const [endH, endM] = (time.endTime || '00:00').split(':').map(Number);

        itemsByDay[dayMatch].push({
          session,
          time,
          startMinutes: (startH || 0) * 60 + (startM || 0),
          endMinutes: (endH || 0) * 60 + (endM || 0),
        });
      }
    }

    if (!hasMatchedDay) {
      unscheduledSessions.push(session);
    }
  }

  // Sort each day chronologically
  for (const d of DAYS) {
    itemsByDay[d].sort((a, b) => a.startMinutes - b.startMinutes);
  }

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 16;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('AWS re:Invent 2026 • Official Itinerary Matrix', marginX, 10);
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // --- Document Main Header ---
  // Top decorative bar
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.rect(marginX, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('AWS re:Invent 2026 — Schedule Matrix', marginX, currentY);
  currentY += 6;

  // Subtitle & Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text(
    `Personalized Itinerary & Campus Transit Optimizer • Generated ${dateStr} • ${sessions.length} Session${
      sessions.length === 1 ? '' : 's'
    }`,
    marginX,
    currentY
  );
  currentY += 6;

  // Header separator
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 6;

  // Render Days
  let anyScheduledPrinted = false;

  for (const day of DAYS) {
    const items = itemsByDay[day];
    if (items.length === 0) continue;

    anyScheduledPrinted = true;
    checkPageBreak(20);

    // Day Header Banner
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.roundedRect(marginX, currentY, contentWidth, 7.5, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(day.toUpperCase(), marginX + 4, currentY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11); // Amber 500
    const countLabel = `${items.length} session${items.length === 1 ? '' : 's'}`;
    const countLabelWidth = doc.getTextWidth(countLabel);
    doc.text(countLabel, marginX + contentWidth - countLabelWidth - 4, currentY + 5.2);

    currentY += 11;

    // Render items for this day
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nextItem = items[i + 1];

      // Calculate heights
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const titleLines = doc.splitTextToSize(item.session.title, contentWidth - 46);
      const titleHeight = titleLines.length * 4.2;

      // Abstract lines (up to 2 lines)
      let abstractLines: string[] = [];
      if (item.session.abstract) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const allAbstractLines = doc.splitTextToSize(item.session.abstract, contentWidth - 46);
        abstractLines = allAbstractLines.slice(0, 2);
        if (allAbstractLines.length > 2) {
          abstractLines[1] = abstractLines[1].replace(/\.*$/, '...');
        }
      }
      const abstractHeight = abstractLines.length * 3.4;

      const cardHeight = Math.max(18, 11 + titleHeight + abstractHeight);
      checkPageBreak(cardHeight + 8);

      // Card Background Box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      // Left Column: Time & Duration Box
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(marginX + 2, currentY + 2, 40, cardHeight - 4, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9); // Amber 700
      const timeStr = `${item.time.startTimeFormatted || item.time.startTime || ''}`;
      const endTimeStr = `${item.time.endTimeFormatted || item.time.endTime || ''}`;
      doc.text(timeStr, marginX + 4, currentY + 6.5);
      doc.text(`to ${endTimeStr}`, marginX + 4, currentY + 10.5);

      if (item.time.duration) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(`${item.time.duration} mins`, marginX + 4, currentY + 14.5);
      }

      // Right Column: Session Details
      const detailX = marginX + 44;
      let detailY = currentY + 5.5;

      // Session Code & Badges
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(217, 119, 6); // Amber 600
      doc.text(item.session.code, detailX, detailY);
      const codeWidth = doc.getTextWidth(item.session.code);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const metaBadge = `  •  ${item.session.type || 'Session'}  •  ${item.session.level || 'All Levels'}`;
      doc.text(metaBadge, detailX + codeWidth, detailY);

      detailY += 4.5;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // Slate 900
      for (const line of titleLines) {
        doc.text(line, detailX, detailY);
        detailY += 4.2;
      }

      // Campus & Room location
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // Slate 700
      const locationText = `${item.session.campus || 'Venue TBD'}  —  ${item.time.room || item.session.venue || 'Room TBD'}`;
      doc.text(locationText, detailX, detailY);
      detailY += 3.8;

      // Abstract (if present)
      if (abstractLines.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        for (const line of abstractLines) {
          doc.text(line, detailX, detailY);
          detailY += 3.4;
        }
      }

      currentY += cardHeight + 2;

      // Transit connector between consecutive sessions
      if (nextItem) {
        const availableMinutes = nextItem.startMinutes - item.endMinutes;
        const reqMinutes = getRequiredTransitMinutes(item.session.campus, nextItem.session.campus);
        const isConflict = availableMinutes < reqMinutes;
        const isSameCampus = item.session.campus === nextItem.session.campus;

        checkPageBreak(9);

        if (isConflict) {
          // Warning transit banner
          doc.setFillColor(255, 241, 242); // Rose 50
          doc.setDrawColor(254, 205, 211); // Rose 200
          doc.setLineWidth(0.3);
          doc.roundedRect(marginX + 6, currentY, contentWidth - 12, 6.5, 1, 1, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(225, 29, 72); // Rose 600
          const transitText = `! TRANSIT HAZARD: ${reqMinutes}m travel needed (${item.session.campus} -> ${nextItem.session.campus}), only ${availableMinutes}m available!`;
          doc.text(transitText, marginX + 9, currentY + 4.5);
        } else if (isSameCampus) {
          // Same campus stroll
          doc.setFillColor(236, 253, 245); // Emerald 50
          doc.setDrawColor(167, 243, 208); // Emerald 200
          doc.setLineWidth(0.2);
          doc.roundedRect(marginX + 6, currentY, contentWidth - 12, 6, 1, 1, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(5, 150, 105); // Emerald 600
          const transitText = `✓ Same campus (${item.session.campus}) • ~10m walk • ${availableMinutes}m buffer gap`;
          doc.text(transitText, marginX + 9, currentY + 4.2);
        } else {
          // Standard cross-campus transit
          doc.setFillColor(241, 245, 249); // Slate 100
          doc.setDrawColor(203, 213, 225); // Slate 300
          doc.setLineWidth(0.2);
          doc.roundedRect(marginX + 6, currentY, contentWidth - 12, 6, 1, 1, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105); // Slate 600
          const transitText = `➔ Shuttle / Transit: ${item.session.campus} to ${nextItem.session.campus} (${reqMinutes}m needed • ${availableMinutes}m gap)`;
          doc.text(transitText, marginX + 9, currentY + 4.2);
        }

        currentY += 8.5;
      } else {
        currentY += 2;
      }
    }

    currentY += 4;
  }

  // Render Unscheduled Sessions if any exist
  if (unscheduledSessions.length > 0) {
    checkPageBreak(18);

    doc.setFillColor(71, 85, 105); // Slate 600
    doc.roundedRect(marginX, currentY, contentWidth, 7, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('UNSCHEDULED / FLEXIBLE SESSIONS', marginX + 4, currentY + 5);

    const unscheduledCount = `${unscheduledSessions.length} session${unscheduledSessions.length === 1 ? '' : 's'}`;
    const countWidth = doc.getTextWidth(unscheduledCount);
    doc.text(unscheduledCount, marginX + contentWidth - countWidth - 4, currentY + 5);

    currentY += 10;

    for (const session of unscheduledSessions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const titleLines = doc.splitTextToSize(session.title, contentWidth - 36);
      const cardHeight = Math.max(12, 8 + titleLines.length * 4);

      checkPageBreak(cardHeight + 4);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6);
      doc.text(session.code, marginX + 4, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`(${session.campus || 'Venue TBD'})`, marginX + 24, currentY + 5);

      let lineY = currentY + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      for (const line of titleLines) {
        doc.text(line, marginX + 48, lineY);
        lineY += 4;
      }

      currentY += cardHeight + 2;
    }
  }

  if (!anyScheduledPrinted && unscheduledSessions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('No sessions are currently scheduled.', marginX, currentY + 10);
  }

  // --- Add Page Footers to All Pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    // Left footer text
    doc.text(
      'AWS re:Invent 2026 Schedule Matrix • https://stephenford.org/reinvent-2026-finder/',
      marginX,
      pageHeight - 6
    );

    // Right footer text (Page X of Y)
    const pageStr = `Page ${i} of ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - marginX - pageStrWidth, pageHeight - 6);
  }

  // Trigger browser download
  doc.save('reinvent-2026-schedule.pdf');
}
