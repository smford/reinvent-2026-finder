export interface SessionTime {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Monday, Tuesday, etc.
  startTime: string; // 24-hr "16:30"
  endTime: string; // 24-hr "17:30"
  startTimeFormatted: string; // "04:30 PM"
  endTimeFormatted: string; // "05:30 PM"
  duration: number; // minutes
  room: string;
  venue: string;
}

export interface Session {
  id: string;
  code: string;
  title: string;
  type: string;
  level: string;
  topics: string[];
  areasOfInterest: string[];
  roles: string[];
  venue: string;
  campus: string;
  abstract: string;
  times: SessionTime[];
}

export interface Metadata {
  event: string;
  lastUpdated: string;
  totalSessions: number;
  scheduledTimeSlots: number;
  campuses: Record<string, number>;
  venues: Record<string, number>;
  levels: Record<string, number>;
  sessionTypes: Record<string, number>;
  days: Record<string, number>;
  topics: string[];
}

export interface TransitAlert {
  id: string;
  session1: Session;
  time1: SessionTime;
  session2: Session;
  time2: SessionTime;
  transitRequiredMinutes: number;
  availableMinutes: number;
  deficitMinutes: number;
  fromCampus: string;
  toCampus: string;
}

export interface FilterState {
  searchQuery: string;
  selectedDays: string[];
  selectedCampuses: string[];
  selectedVenues: string[];
  selectedLevels: string[];
  selectedTypes: string[];
  selectedTopics: string[];
  selectedTimeOfDay: ('morning' | 'afternoon' | 'evening')[];
  onlyScheduled: boolean;
  bookmarkedOnly: boolean;
}
