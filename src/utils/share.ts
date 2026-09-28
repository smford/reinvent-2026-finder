/**
 * Encodes selected session IDs or codes into a URL hash parameter for frictionless sharing.
 */
export function encodeItineraryToUrl(sessionIds: string[]): void {
  if (!sessionIds.length) {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }
  const param = `itinerary=${encodeURIComponent(sessionIds.join(','))}`;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${param}`);
}

/**
 * Parses shared session IDs from the current URL hash.
 */
export function decodeItineraryFromUrl(): string[] {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return [];

  const parts = hash.split('&');
  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key === 'itinerary' && val) {
      return decodeURIComponent(val).split(',').filter(Boolean);
    }
  }
  return [];
}

/**
 * Copies the current shareable itinerary link to the clipboard.
 */
export async function copyShareableLink(sessionIds: string[]): Promise<boolean> {
  const url = new URL(window.location.href);
  if (sessionIds.length) {
    url.hash = `itinerary=${encodeURIComponent(sessionIds.join(','))}`;
  } else {
    url.hash = '';
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url.toString());
      return true;
    }
  } catch (err) {
    console.warn('Clipboard writeText failed, trying fallback', err);
  }

  // Fallback
  try {
    const input = document.createElement('input');
    input.value = url.toString();
    document.body.appendChild(input);
    input.select();
    const success = document.execCommand('copy');
    document.body.removeChild(input);
    return success;
  } catch {
    return false;
  }
}
