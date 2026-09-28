import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Calendar, MapPin, Layers, Tag, Bookmark, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterState, Metadata } from '../types';

interface FilterSidebarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  metadata: Metadata | null;
  totalFilteredCount: number;
  bookmarkedCount: number;
}

const DAYS = [
  { id: 'Monday', label: 'Mon' },
  { id: 'Tuesday', label: 'Tue' },
  { id: 'Wednesday', label: 'Wed' },
  { id: 'Thursday', label: 'Thu' },
  { id: 'Friday', label: 'Fri' },
];

const LEVELS = [
  { id: '100', label: '100 - Foundational', color: 'border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' },
  { id: '200', label: '200 - Intermediate', color: 'border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10' },
  { id: '300', label: '300 - Advanced', color: 'border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  { id: '400', label: '400 - Expert', color: 'border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' },
  { id: '500', label: '500 - Distinguished', color: 'border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterState,
  setFilterState,
  metadata,
  totalFilteredCount,
  bookmarkedCount,
}) => {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');

  const toggleDay = (day: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedDays.includes(day);
      return {
        ...prev,
        selectedDays: exists ? prev.selectedDays.filter((d) => d !== day) : [...prev.selectedDays, day],
      };
    });
  };

  const toggleCampus = (campus: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedCampuses.includes(campus);
      return {
        ...prev,
        selectedCampuses: exists ? prev.selectedCampuses.filter((c) => c !== campus) : [...prev.selectedCampuses, campus],
      };
    });
  };

  const toggleLevel = (lvl: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedLevels.includes(lvl);
      return {
        ...prev,
        selectedLevels: exists ? prev.selectedLevels.filter((l) => l !== lvl) : [...prev.selectedLevels, lvl],
      };
    });
  };

  const toggleType = (type: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists ? prev.selectedTypes.filter((t) => t !== type) : [...prev.selectedTypes, type],
      };
    });
  };

  const toggleTopic = (topic: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedTopics.includes(topic);
      return {
        ...prev,
        selectedTopics: exists ? prev.selectedTopics.filter((t) => t !== topic) : [...prev.selectedTopics, topic],
      };
    });
  };

  const toggleTimeOfDay = (time: 'morning' | 'afternoon' | 'evening') => {
    setFilterState((prev) => {
      const exists = prev.selectedTimeOfDay.includes(time);
      return {
        ...prev,
        selectedTimeOfDay: exists ? prev.selectedTimeOfDay.filter((t) => t !== time) : [...prev.selectedTimeOfDay, time],
      };
    });
  };

  const handleResetFilters = () => {
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
    });
  };

  const activeFilterCount =
    (filterState.searchQuery ? 1 : 0) +
    filterState.selectedDays.length +
    filterState.selectedCampuses.length +
    filterState.selectedLevels.length +
    filterState.selectedTypes.length +
    filterState.selectedTopics.length +
    filterState.selectedTimeOfDay.length +
    (filterState.onlyScheduled ? 1 : 0) +
    (filterState.bookmarkedOnly ? 1 : 0);

  const filteredTopics = (metadata?.topics || []).filter((t) =>
    t.toLowerCase().includes(topicSearch.toLowerCase())
  );
  const visibleTopics = showAllTopics ? filteredTopics : filteredTopics.slice(0, 8);

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={filterState.searchQuery}
          onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
          placeholder="Search sessions, topics, codes..."
          className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
        />
        {filterState.searchQuery && (
          <button
            onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Header and Reset */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Filters</span>
          <span className="text-xs text-slate-500 font-mono">({totalFilteredCount})</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Toggles: Bookmarked & Scheduled */}
      <div className="space-y-2">
        <button
          onClick={() => setFilterState((prev) => ({ ...prev, bookmarkedOnly: !prev.bookmarkedOnly }))}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium border transition-all ${
            filterState.bookmarkedOnly
              ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Bookmark className={`h-3.5 w-3.5 ${filterState.bookmarkedOnly ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>My Bookmarked Sessions</span>
          </span>
          <span className="font-mono text-[11px]">{bookmarkedCount}</span>
        </button>

        <button
          onClick={() => setFilterState((prev) => ({ ...prev, onlyScheduled: !prev.onlyScheduled }))}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium border transition-all ${
            filterState.onlyScheduled
              ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300 font-bold'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Has Scheduled Times</span>
          </span>
          <span className="font-mono text-[11px]">{metadata?.scheduledTimeSlots || ''}</span>
        </button>
      </div>

      {/* Days Filter */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          Day of Week
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {DAYS.map((day) => {
            const isSelected = filterState.selectedDays.includes(day.id);
            const count = metadata?.days[day.id] || 0;
            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">{day.label}</span>
                <span className="text-[10px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time of Day Filter */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">
          Time of Day
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'morning', label: 'Morning', sub: '< 12 PM' },
            { id: 'afternoon', label: 'Afternoon', sub: '12 - 5 PM' },
            { id: 'evening', label: 'Evening', sub: '5 PM+' },
          ].map((t) => {
            const isSelected = filterState.selectedTimeOfDay.includes(t.id as any);
            return (
              <button
                key={t.id}
                onClick={() => toggleTimeOfDay(t.id as any)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-medium">{t.label}</div>
                <div className="text-[10px] opacity-70">{t.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus Clusters Filter */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
          <MapPin className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          Campus Cluster (Zero Transit)
        </label>
        <div className="space-y-1.5">
          {metadata &&
            Object.entries(metadata.campuses).map(([campus, count]) => {
              const isSelected = filterState.selectedCampuses.includes(campus);
              return (
                <div
                  key={campus}
                  onClick={() => toggleCampus(campus)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-3.5 w-3.5 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-500 dark:border-indigo-400 text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span>{campus}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Technical Level Filter */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          Technical Level
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {LEVELS.map((lvl) => {
            const isSelected = filterState.selectedLevels.includes(lvl.id);
            const count = Object.entries(metadata?.levels || {}).find(([k]) => k.startsWith(lvl.id))?.[1] || 0;
            return (
              <button
                key={lvl.id}
                onClick={() => toggleLevel(lvl.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${
                  isSelected
                    ? `${lvl.color} border-current font-bold shadow-sm`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Level {lvl.id}</span>
                <span className="text-[10px] opacity-70 font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Types Filter */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
          Session Type
        </label>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {metadata &&
            Object.entries(metadata.sessionTypes).map(([type, count]) => {
              const isSelected = filterState.selectedTypes.includes(type);
              return (
                <div
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-3 w-3 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="h-2 w-2" />}
                    </div>
                    <span className="truncate">{type}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Topics / Taxonomies Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            Topic & Track
          </label>
        </div>
        {showAllTopics && (
          <input
            type="text"
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Filter topics..."
            className="w-full mb-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        )}
        <div className="space-y-1.5">
          {visibleTopics.map((topic) => {
            const isSelected = filterState.selectedTopics.includes(topic);
            return (
              <div
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-xs cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-500/60 text-purple-900 dark:text-purple-200 font-medium'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{topic}</span>
                {isSelected && <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
        {filteredTopics.length > 8 && (
          <button
            onClick={() => setShowAllTopics(!showAllTopics)}
            className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 hover:underline pt-2 font-medium"
          >
            <span>{showAllTopics ? 'Show fewer topics' : `Show all (${filteredTopics.length})`}</span>
            {showAllTopics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>
    </aside>
  );
};
