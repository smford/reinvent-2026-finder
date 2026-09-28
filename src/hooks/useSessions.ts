import { useState, useEffect, useMemo, useCallback } from 'react';
import MiniSearch from 'minisearch';
import { Session, Metadata, FilterState } from '../types';
import { decodeItineraryFromUrl, encodeItineraryToUrl } from '../utils/share';

const LOCAL_STORAGE_KEY = 'reinvent_itinerary_2026';

const initialFilterState: FilterState = {
  searchQuery: '',
  selectedDays: [],
  selectedCampuses: [],
  selectedVenues: [],
  selectedLevels: [],
  selectedTypes: [],
  selectedTopics: [],
  selectedTimeOfDay: [],
  onlyScheduled: false,
  bookmarkedOnly: false,
};

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize filterState with bookmarkedOnly=true if URL contains an itinerary
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const fromUrl = decodeItineraryFromUrl();
    if (fromUrl.length > 0) {
      return { ...initialFilterState, bookmarkedOnly: true };
    }
    return initialFilterState;
  });

  // Initialize bookmarks from URL hash (if shared) or LocalStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    const fromUrl = decodeItineraryFromUrl();
    if (fromUrl.length > 0) {
      return new Set(fromUrl);
    }
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return new Set();
  });

  // Listen for dynamic hashchange and popstate events (e.g. user pasting or navigating shared links)
  useEffect(() => {
    const handleUrlChange = () => {
      const fromUrl = decodeItineraryFromUrl();
      if (fromUrl.length > 0) {
        setBookmarkedIds(new Set(fromUrl));
        setFilterState((prev) => ({ ...prev, bookmarkedOnly: true }));
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Keep LocalStorage and URL in sync with bookmarks
  useEffect(() => {
    const idsArray = Array.from(bookmarkedIds);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(idsArray));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
    encodeItineraryToUrl(idsArray);
  }, [bookmarkedIds]);

  // Load static data from JSON or cache
  const reloadCatalog = useCallback(async (forceNetwork = true): Promise<number> => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      const cacheBust = forceNetwork ? `?v=${Date.now()}` : '';
      const fetchOptions: RequestInit = forceNetwork ? { cache: 'reload' } : {};

      let sessionsRes: Response | null = await fetch(
        `${cleanBase}data/sessions.min.json${cacheBust}`,
        fetchOptions
      ).catch(() => null);
      let metaRes: Response | null = await fetch(
        `${cleanBase}data/metadata.json${cacheBust}`,
        fetchOptions
      ).catch(() => null);

      // Fallback to CacheStorage if network is offline
      if ((!sessionsRes || !sessionsRes.ok) && typeof caches !== 'undefined') {
        const cachedSession =
          (await caches.match(`${cleanBase}data/sessions.min.json`)) ||
          (await caches.match('./data/sessions.min.json'));
        if (cachedSession) sessionsRes = cachedSession;

        const cachedMeta =
          (await caches.match(`${cleanBase}data/metadata.json`)) ||
          (await caches.match('./data/metadata.json'));
        if (cachedMeta) metaRes = cachedMeta;
      }

      if (!sessionsRes || !sessionsRes.ok) {
        throw new Error('Unable to load session catalog. Please check your connection.');
      }

      const sessionsData: Session[] = await sessionsRes.json();
      setSessions(sessionsData);

      if (metaRes && metaRes.ok) {
        const metaData: Metadata = await metaRes.json();
        setMetadata(metaData);
      }

      // Update CacheStorage directly so offline access has the freshest data
      if (typeof caches !== 'undefined' && forceNetwork) {
        try {
          const cache = await caches.open('reinvent-2026-cache-v2');
          await cache.put(
            `${cleanBase}data/sessions.min.json`,
            new Response(JSON.stringify(sessionsData), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } catch (e) {
          console.warn('Could not update cache storage:', e);
        }
      }

      return sessionsData.length;
    } catch (err: unknown) {
      console.error('Error loading session data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadCatalog(false);
  }, [reloadCatalog]);

  // Configure MiniSearch instance for instant search
  const miniSearch = useMemo(() => {
    if (!sessions.length) return null;

    const ms = new MiniSearch<Session>({
      fields: ['code', 'title', 'abstract', 'type', 'level', 'topics', 'areasOfInterest', 'venue', 'campus'],
      storeFields: ['id'],
      searchOptions: {
        boost: { code: 4, title: 2.5, topics: 1.5, areasOfInterest: 1.5 },
        prefix: true,
        fuzzy: 0.2,
      },
      extractField: (document, fieldName) => {
        const val = (document as unknown as Record<string, unknown>)[fieldName];
        if (Array.isArray(val)) {
          return val.join(' ');
        }
        return (val as string) || '';
      },
    });

    ms.addAll(sessions);
    return ms;
  }, [sessions]);

  // Fast mapping of session ID to Session object
  const sessionMap = useMemo(() => {
    const map = new Map<string, Session>();
    for (const s of sessions) {
      map.set(s.id, s);
      if (s.code) {
        map.set(s.code, s);
      }
    }
    return map;
  }, [sessions]);

  // Normalize any session codes in bookmarkedIds to canonical IDs once catalog loads
  useEffect(() => {
    if (!sessions.length || !bookmarkedIds.size) return;
    let needsNormalization = false;
    const normalized = new Set<string>();

    bookmarkedIds.forEach((idOrCode) => {
      const found = sessionMap.get(idOrCode);
      if (found) {
        normalized.add(found.id);
        if (found.id !== idOrCode) needsNormalization = true;
      } else {
        normalized.add(idOrCode);
      }
    });

    if (needsNormalization) {
      setBookmarkedIds(normalized);
    }
  }, [sessions, sessionMap, bookmarkedIds]);

  // Bookmarked sessions list
  const bookmarkedSessions = useMemo(() => {
    const list: Session[] = [];
    bookmarkedIds.forEach((id) => {
      const found = sessionMap.get(id);
      if (found) list.push(found);
    });
    return list;
  }, [bookmarkedIds, sessionMap]);

  // Toggle bookmark callback
  const toggleBookmark = useCallback((sessionId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  // Add multiple bookmarks (e.g. from Campus Bundler)
  const addMultipleBookmarks = useCallback((sessionIds: string[]) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      sessionIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    setBookmarkedIds(new Set());
  }, []);

  // Optional Live Sync from AWS Rainfocus API directly in browser
  const refreshLiveFromAWS = useCallback(async () => {
    setIsRefreshingLive(true);
    try {
      // 1. Resolve tokens
      const resolverRes = await fetch(
        'https://registration.awsevents.com/flow/loadPage?pageUri=eventcatalog&workflowApiToken=awsevents.reinvent2026.eventcatalog'
      );
      const resolverJson = await resolverRes.json();
      const widgetConf = resolverJson?.data?.widgetConf || {};
      const widgetId = widgetConf.widgetId || '1782747647615002ute1';
      const apiProfileId = widgetConf.apiProfileToken || 'mSEPBdEOSHwzxJwd7H8MfSWVylSYQsS4';

      // 2. Fetch page 0
      const searchRes = await fetch('https://catalog.awsevents.com/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          rfWidgetId: widgetId,
          rfApiProfileId: apiProfileId,
        },
        body: 'type=session&size=50&from=0',
      });
      const searchJson = await searchRes.json();
      const total = searchJson.totalSearchItems || searchJson.total || 0;

      if (total > 0) {
        alert(`Connected to AWS live API successfully! Confirmed ${total} sessions in live catalog.`);
      }
    } catch (e: unknown) {
      console.error('Live sync error:', e);
      alert('Unable to sync directly with AWS (browser extension or network policy may restrict external API calls). Static dataset remains active.');
    } finally {
      setIsRefreshingLive(false);
    }
  }, []);

  // Filtered session list calculation
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // 1. Full-text search
    if (filterState.searchQuery.trim() && miniSearch) {
      const searchHits = miniSearch.search(filterState.searchQuery.trim());
      const hitIds = new Set(searchHits.map((h) => h.id));
      result = result.filter((s) => hitIds.has(s.id));
    }

    // 2. Bookmarked only filter (supports both canonical id and session code)
    if (filterState.bookmarkedOnly) {
      result = result.filter(
        (s) => bookmarkedIds.has(s.id) || (s.code && bookmarkedIds.has(s.code))
      );
    }

    // 3. Only scheduled filter
    if (filterState.onlyScheduled) {
      result = result.filter((s) => s.times.length > 0);
    }

    // 4. Days filter
    if (filterState.selectedDays.length > 0) {
      result = result.filter((s) =>
        s.times.some((t) => filterState.selectedDays.includes(t.day))
      );
    }

    // 5. Campuses filter
    if (filterState.selectedCampuses.length > 0) {
      result = result.filter((s) =>
        filterState.selectedCampuses.includes(s.campus)
      );
    }

    // 6. Venues filter
    if (filterState.selectedVenues.length > 0) {
      result = result.filter((s) =>
        filterState.selectedVenues.includes(s.venue)
      );
    }

    // 7. Levels filter
    if (filterState.selectedLevels.length > 0) {
      result = result.filter((s) =>
        filterState.selectedLevels.some((lvl) => s.level.startsWith(lvl))
      );
    }

    // 8. Session Types filter
    if (filterState.selectedTypes.length > 0) {
      result = result.filter((s) =>
        filterState.selectedTypes.includes(s.type)
      );
    }

    // 9. Topics filter
    if (filterState.selectedTopics.length > 0) {
      result = result.filter((s) =>
        filterState.selectedTopics.some((topic) => s.topics.includes(topic))
      );
    }

    // 10. Time of Day filter
    if (filterState.selectedTimeOfDay.length > 0) {
      result = result.filter((s) =>
        s.times.some((t) => {
          const hour = parseInt(t.startTime.split(':')[0], 10);
          if (isNaN(hour)) return false;
          if (filterState.selectedTimeOfDay.includes('morning') && hour < 12) return true;
          if (filterState.selectedTimeOfDay.includes('afternoon') && hour >= 12 && hour < 17) return true;
          if (filterState.selectedTimeOfDay.includes('evening') && hour >= 17) return true;
          return false;
        })
      );
    }

    return result;
  }, [sessions, miniSearch, filterState, bookmarkedIds]);

  return {
    sessions,
    metadata,
    filteredSessions,
    bookmarkedSessions,
    bookmarkedIds,
    isLoading,
    isRefreshingLive,
    error,
    filterState,
    setFilterState,
    toggleBookmark,
    addMultipleBookmarks,
    clearBookmarks,
    refreshLiveFromAWS,
    reloadCatalog,
    initialFilterState,
  };
}
