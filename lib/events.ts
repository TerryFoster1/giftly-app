import type { Profile } from "./types";

export function calculateDaysUntil(dateValue: string | Date) {
  const source = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(source.getTime())) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), source.getMonth(), source.getDate());

  if (next < start) {
    next = new Date(today.getFullYear() + 1, source.getMonth(), source.getDate());
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - start.getTime()) / msPerDay);
}

export function formatEventDate(dateValue?: string) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function getUpcomingProfileEvents(profiles: Profile[]) {
  return profiles
    .flatMap((profile) => {
      const events = [];
      if (profile.birthday) {
        const daysUntil = calculateDaysUntil(profile.birthday);
        if (daysUntil !== null) {
          events.push({
            id: `${profile.id}-birthday`,
            profileName: profile.displayName,
            eventType: "birthday",
            dateLabel: formatEventDate(profile.birthday),
            daysUntil
          });
        }
      }
      if (profile.anniversary) {
        const daysUntil = calculateDaysUntil(profile.anniversary);
        if (daysUntil !== null) {
          events.push({
            id: `${profile.id}-anniversary`,
            profileName: profile.displayName,
            eventType: "anniversary",
            dateLabel: formatEventDate(profile.anniversary),
            daysUntil
          });
        }
      }
      return events;
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
