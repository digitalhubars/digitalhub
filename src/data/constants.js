export const MINUTE = 6e4;
export const HOUR = 36e5;
export const DAY = 864e5;

// "Today" for charts, week-over-week math and the sample data.
export const NOW = Date.now();

// Relative to the real clock, so "last sync" labels stay fresh.
export const minutesAgo = (minutes) => Date.now() - minutes * MINUTE;
