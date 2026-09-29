/**
 * analytics.ts
 *
 * Central GA4 event tracking utility for re:Invent 2026 Finder.
 *
 * - Detects whether the user is running in the installed PWA (standalone)
 *   or a regular browser tab.
 * - Attaches `pwa_mode: 'standalone' | 'browser'` to every event so GA4
 *   reports can segment and compare the two audiences.
 * - All functions are no-ops when gtag is not loaded (e.g. during dev if
 *   the script is blocked by an ad blocker).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ─── PWA detection ──────────────────────────────────────────────────────────

/**
 * Returns 'standalone' when the app was launched from the home screen icon
 * (installed PWA), or 'browser' when accessed as a regular web page.
 */
function getPwaMode(): 'standalone' | 'browser' {
  if (typeof window === 'undefined') return 'browser';
  // Standard display-mode media query (Chrome/Android/Desktop PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  // iOS Safari sets navigator.standalone when added to home screen
  if ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) {
    return 'standalone';
  }
  return 'browser';
}

/** Cached once at module load so it doesn't change mid-session. */
export const PWA_MODE = getPwaMode();

// ─── Base event sender ───────────────────────────────────────────────────────

type GaParams = Record<string, string | number | boolean | undefined>;

/**
 * Send a GA4 custom event. Automatically appends `pwa_mode` to every event.
 * Safe to call even if gtag hasn't loaded (queues via dataLayer or no-ops).
 */
export function trackEvent(eventName: string, params: GaParams = {}): void {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        pwa_mode: PWA_MODE,
        ...params,
      });
    }
  } catch {
    // Silently ignore — analytics must never break the app
  }
}

// ─── Typed event helpers ─────────────────────────────────────────────────────

/** Fired once when the app first mounts. */
export function trackAppOpen(): void {
  trackEvent('app_open', { pwa_mode: PWA_MODE });
}

/** Fired on each full page_view (also sent automatically by gtag config, but
 *  we fire an extra one so we always have pwa_mode attached). */
export function trackPageView(path: string): void {
  trackEvent('page_view', { page_path: path });
}

// Sessions ───────────────────────────────────────────────────────────────────

/** User added a session to their schedule. */
export function trackSessionBookmarked(sessionCode: string, sessionTitle: string, campus: string): void {
  trackEvent('session_bookmarked', {
    session_code: sessionCode,
    session_title: sessionTitle.slice(0, 100),
    campus,
  });
}

/** User removed a session from their schedule. */
export function trackSessionRemoved(sessionCode: string, campus: string): void {
  trackEvent('session_removed', {
    session_code: sessionCode,
    campus,
  });
}

/** User opened the session detail modal. */
export function trackSessionViewed(sessionCode: string, sessionTitle: string): void {
  trackEvent('session_viewed', {
    session_code: sessionCode,
    session_title: sessionTitle.slice(0, 100),
  });
}

/** User cleared their entire schedule. */
export function trackScheduleCleared(sessionCount: number): void {
  trackEvent('schedule_cleared', { session_count: sessionCount });
}

// Schedule drawer ────────────────────────────────────────────────────────────

/** User opened the My Schedule drawer. */
export function trackScheduleOpened(sessionCount: number): void {
  trackEvent('schedule_opened', { session_count: sessionCount });
}

// Sharing & export ───────────────────────────────────────────────────────────

/** User copied a shareable schedule link. */
export function trackScheduleShared(sessionCount: number, source: 'header' | 'drawer' | 'banner'): void {
  trackEvent('schedule_shared', { session_count: sessionCount, source });
}

/** User exported their schedule to an .ics calendar file. */
export function trackIcsExported(sessionCount: number): void {
  trackEvent('ics_exported', { session_count: sessionCount });
}

/** User downloaded their schedule as a PDF. */
export function trackPdfDownloaded(sessionCount: number, source: 'header' | 'drawer' | 'banner'): void {
  trackEvent('pdf_downloaded', { session_count: sessionCount, source });
}

/** User printed their schedule. */
export function trackSchedulePrinted(sessionCount: number, source: 'header' | 'drawer' | 'banner'): void {
  trackEvent('schedule_printed', { session_count: sessionCount, source });
}

// Campus Bundler ─────────────────────────────────────────────────────────────

/** User opened the Campus Bundler modal. */
export function trackBundlerOpened(): void {
  trackEvent('bundler_opened');
}

/** User applied a bundler suggestion (added sessions). */
export function trackBundlerApplied(campus: string, day: string, sessionCount: number): void {
  trackEvent('bundler_applied', { campus, day, session_count: sessionCount });
}

// Updates ────────────────────────────────────────────────────────────────────

/** User triggered a PWA/catalog update. */
export function trackUpdateTriggered(updateAvailable: boolean): void {
  trackEvent('update_triggered', { had_update_available: updateAvailable });
}

// Theme ──────────────────────────────────────────────────────────────────────

/** User toggled light/dark mode. */
export function trackThemeToggled(newTheme: 'light' | 'dark'): void {
  trackEvent('theme_toggled', { new_theme: newTheme });
}

// Font size ──────────────────────────────────────────────────────────────────

/** User changed the app font size. */
export function trackFontSizeChanged(newSize: string, direction: 'increase' | 'decrease' | 'reset'): void {
  trackEvent('font_size_changed', { new_size: newSize, direction });
}

// Search & filter ────────────────────────────────────────────────────────────

/** User performed a search (debounced — called after 800 ms of inactivity). */
export function trackSearch(query: string, resultCount: number): void {
  trackEvent('search', {
    search_term: query.slice(0, 100),
    result_count: resultCount,
  });
}
