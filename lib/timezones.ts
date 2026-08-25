export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function getLocalTime(timezone: string) {
  return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
}

export function getOverlapText(aTz: string, bTz: string): string {
  const now = new Date();
  const aLocal = new Date(now.toLocaleString("en-US", { timeZone: aTz }));
  const bLocal = new Date(now.toLocaleString("en-US", { timeZone: bTz }));
  const aHour = aLocal.getHours();
  const bHour = bLocal.getHours();
  const diff = aHour - bHour;
  const hours = Math.abs(diff);
  const direction = diff >= 0 ? `${hours}h ahead` : `${hours}h behind`;
  return direction;
}

export function formatTimeIn(timezone: string) {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function dayKey() {
  return new Date().toISOString().slice(0, 10);
}
