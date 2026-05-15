import type { GiftEvent, Profile } from "./types";

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

function daysLabel(daysUntil: number) {
  if (daysUntil === 0) return "today";
  if (daysUntil >= 60) return `in ${Math.round(daysUntil / 30)} months`;
  return `in ${daysUntil} days`;
}

function eventName(value: string) {
  return value.toLowerCase().replace("_", " ");
}

export type UpcomingGiftlyEvent = {
  id: string;
  profileName: string;
  eventType: string;
  title: string;
  dateLabel: string;
  daysUntil: number;
  reminderText: string;
};

export function getUpcomingProfileEvents(profiles: Profile[], giftEvents: GiftEvent[] = []): UpcomingGiftlyEvent[] {
  const profileEvents = profiles
    .flatMap((profile) => {
      const events = [];
      if (profile.birthday) {
        const daysUntil = calculateDaysUntil(profile.birthday);
        if (daysUntil !== null) {
          events.push({
            id: `${profile.id}-birthday`,
            profileName: profile.displayName,
            eventType: "birthday",
            title: `${profile.displayName}'s birthday`,
            dateLabel: formatEventDate(profile.birthday),
            daysUntil,
            reminderText: `${profile.displayName}'s birthday ${daysLabel(daysUntil)}`
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
            title: `${profile.displayName}'s anniversary`,
            dateLabel: formatEventDate(profile.anniversary),
            daysUntil,
            reminderText: `${profile.displayName}'s anniversary ${daysLabel(daysUntil)}`
          });
        }
      }
      return events;
    });

  const savedEvents = giftEvents
    .map((event) => {
      if (!event.eventDate) return null;
      const daysUntil = calculateDaysUntil(event.eventDate);
      if (daysUntil === null) return null;
      return {
        id: event.id,
        profileName: event.title,
        eventType: eventName(event.eventType),
        title: event.title,
        dateLabel: formatEventDate(event.eventDate),
        daysUntil,
        reminderText: `${event.title} ${daysLabel(daysUntil)}`
      };
    })
    .filter((event): event is UpcomingGiftlyEvent => Boolean(event));

  return [...profileEvents, ...savedEvents]
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
