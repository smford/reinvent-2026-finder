import React, { useState, useMemo } from 'react';
import { useSessions } from './hooks/useSessions';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { FilterSidebar } from './components/FilterSidebar';
import { SessionCard } from './components/SessionCard';
import { TransitAlertBanner } from './components/TransitAlertBanner';
import { ItineraryDrawer } from './components/ItineraryDrawer';
import { CampusBundlerModal } from './components/CampusBundlerModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { detectTransitAlerts } from './utils/transit';
import { Session } from './types';
import { Compass, Filter, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
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
  } = useSessions();

  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [isBundlerOpen, setIsBundlerOpen] = useState(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<Session | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 40;

  // Real-time transit hazard detection across bookmarked sessions
  const transitAlerts = useMemo(() => {
    return detectTransitAlerts(bookmarkedSessions);
  }, [bookmarkedSessions]);

  // Paginated slice of filtered sessions to ensure instant rendering
  const paginatedSessions = useMemo(() => {
    return filteredSessions.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredSessions, page]);

  // Reset page when filters or search change
  React.useEffect(() => {
    setPage(1);
  }, [filterState]);

  const handleApplyBundlerFilters = (day: string, campus: string) => {
    setFilterState((prev) => ({
      ...prev,
      selectedDays: [day],
      selectedCampuses: [campus],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Header */}
      <Header
        totalSessions={metadata?.totalSessions || sessions.length}
        bookmarkedSessions={bookmarkedSessions}
        transitAlerts={transitAlerts}
        onOpenItinerary={() => setIsItineraryOpen(true)}
        onOpenBundler={() => setIsBundlerOpen(true)}
        onRefreshLive={refreshLiveFromAWS}
        isRefreshingLive={isRefreshingLive}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Offline Mode Status Banner */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-center space-x-2">
          <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span>
            <strong>Offline Mode Active:</strong> Full 2,043 session catalog, search index, and your itinerary are available offline.
          </span>
        </div>
      )}

      {/* Transit Conflict Alert Banner */}
      <TransitAlertBanner
        alerts={transitAlerts}
        onOpenItinerary={() => setIsItineraryOpen(true)}
      />

      {/* Hero / Quick Action Strip */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 via-indigo-50/40 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              AWS re:Invent 2026: <strong className="text-slate-900 dark:text-white">{metadata?.totalSessions || 2043}</strong> sessions indexed across 5 Las Vegas campuses.
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBundlerOpen(true)}
              className="flex items-center space-x-1.5 text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Launch Campus Bundler (Zero Commute Planner)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <Filter className="h-4 w-4 text-amber-500" />
            <span>{isMobileFilterOpen ? 'Hide Filters' : 'Filter Sessions & Campuses'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Filter Sidebar */}
          <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80`}>
            <FilterSidebar
              filterState={filterState}
              setFilterState={setFilterState}
              metadata={metadata}
              totalFilteredCount={filteredSessions.length}
              bookmarkedCount={bookmarkedSessions.length}
            />
          </div>

          {/* Right Session Feed */}
          <div className="flex-1 w-full space-y-4">
            {/* Results Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Showing <strong className="text-amber-600 dark:text-amber-400 font-bold">{filteredSessions.length}</strong> of{' '}
                  {metadata?.totalSessions || sessions.length} sessions
                </span>
                {filterState.searchQuery && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    for &ldquo;<span className="text-slate-800 dark:text-slate-200 font-medium">{filterState.searchQuery}</span>&rdquo;
                  </span>
                )}
              </div>

              {filteredSessions.length > 0 && (
                <span className="text-xs text-slate-500">
                  Showing {Math.min(paginatedSessions.length, filteredSessions.length)} items
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-24 text-center">
                <RefreshCw className="mx-auto h-8 w-8 text-amber-500 animate-spin mb-3" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Loading re:Invent 2026 Catalog...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Indexing 2,000+ sessions for instant search</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-6 text-center text-rose-800 dark:text-rose-200">
                <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
                <h3 className="font-semibold text-sm">Failed to load session catalog</h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{error}</p>
                <button
                  onClick={refreshLiveFromAWS}
                  className="mt-4 rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-900 dark:hover:bg-rose-800 px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  Retry with Live AWS API
                </button>
              </div>
            )}

            {/* Session Card Grid */}
            {!isLoading && !error && (
              <div className="space-y-4">
                {paginatedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isBookmarked={bookmarkedIds.has(session.id)}
                    onToggleBookmark={toggleBookmark}
                    onSelectSession={(s) => setSelectedSessionForModal(s)}
                  />
                ))}

                {/* Empty State */}
                {filteredSessions.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-16 text-center shadow-sm">
                    <Filter className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">No matching sessions found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Try clearing some filters, searching for a different keyword, or using the Campus Bundler.
                    </p>
                    <button
                      onClick={() =>
                        setFilterState({
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
                        })
                      }
                      className="mt-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}

                {/* Infinite Pagination Trigger */}
                {paginatedSessions.length < filteredSessions.length && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-6 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
                    >
                      Load More Sessions ({filteredSessions.length - paginatedSessions.length} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <p className="font-medium text-slate-600 dark:text-slate-400">
          Built for the AWS community • Zero-transit schedule optimizer for AWS re:Invent 2026.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Data synchronized directly from the official AWS Event Catalog via RainFocus API. Unofficial community tool; Amazon Web Services, AWS, and re:Invent are trademarks of Amazon.com, Inc. or its affiliates.
        </p>
      </footer>

      {/* Modals & Drawers */}
      <ItineraryDrawer
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        sessions={bookmarkedSessions}
        transitAlerts={transitAlerts}
        onRemoveSession={toggleBookmark}
        onClearAll={clearBookmarks}
        onSelectSession={(s) => setSelectedSessionForModal(s)}
      />

      <CampusBundlerModal
        isOpen={isBundlerOpen}
        onClose={() => setIsBundlerOpen(false)}
        sessions={sessions}
        bookmarkedIds={bookmarkedIds}
        onAddMultipleBookmarks={addMultipleBookmarks}
        onApplyFilters={handleApplyBundlerFilters}
      />

      <SessionDetailModal
        session={selectedSessionForModal}
        onClose={() => setSelectedSessionForModal(null)}
        isBookmarked={selectedSessionForModal ? bookmarkedIds.has(selectedSessionForModal.id) : false}
        onToggleBookmark={toggleBookmark}
      />
    </div>
  );
};
