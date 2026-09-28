/**
 * Encodes selected session IDs or codes into a URL hash parameter for frictionless sharing.
 */
export function encodeItineraryToUrl(sessionIds: string[]): void {
  if (typeof window === 'undefined') return;

  if (!sessionIds.length) {
    if (window.location.hash.includes('itinerary=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }
  const param = `itinerary=${encodeURIComponent(sessionIds.join(','))}`;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${param}`);
}

/**
 * Checks whether an itinerary parameter is present in current URL (hash or search).
 */
export function hasSharedItineraryInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash.includes('itinerary=') ||
    window.location.search.includes('itinerary=')
  );
}

/**
 * Parses shared session IDs from the current URL hash or query string.
 */
export function decodeItineraryFromUrl(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    // 1. Check URL query string (?itinerary=...)
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get('itinerary');
    if (fromSearch) {
      return decodeURIComponent(fromSearch)
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // 2. Check URL hash (#itinerary=... or #/itinerary=...)
    const hash = window.location.hash.replace(/^#[/]?/, '');
    if (!hash) return [];

    // URLSearchParams parser on hash string
    const hashParams = new URLSearchParams(hash);
    const fromHashParams = hashParams.get('itinerary');
    if (fromHashParams) {
      return decodeURIComponent(fromHashParams)
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Manual fallback for custom hash schemas
    const parts = hash.split('&');
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key === 'itinerary' && val) {
        return decodeURIComponent(val)
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('Error parsing shared itinerary from URL:', err);
  }

  return [];
}

/**
 * Copies the current shareable itinerary link to the clipboard.
 */
export async function copyShareableLink(sessionIds: string[]): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  if (sessionIds.length) {
    url.hash = `itinerary=${encodeURIComponent(sessionIds.join(','))}`;
  } else {
    url.hash = '';
  }

  const shareText = url.toString();

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard writeText failed, trying fallback', err);
  }

  // Fallback using text input selection
  try {
    const input = document.createElement('input');
    input.value = shareText;
    document.body.appendChild(input);
    input.select();
    const success = document.execCommand('copy');
    document.body.removeChild(input);
    return success;
  } catch {
    return false;
  }
}
