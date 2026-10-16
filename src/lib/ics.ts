// Fichiers iCalendar (.ics) pour ajouter les dates de l'agenda à son propre
// calendrier (Apple, Google, Outlook…). Générés au build par les routes de
// src/pages/ics/.
import type { AgendaItem } from '../data/agenda';
import { site } from '../data/site';
import { todayIso } from './dates';

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');

/** Identifiant stable d'une date : « 2027-02-14-saint-valentin-messe-des-amoureux » */
export const itemKey = (item: AgendaItem) => `${item.date}-${slug(item.title)}`;

export const itemIcsUrl = (item: AgendaItem) => `/ics/date/${itemKey(item)}.ics`;

/** Dates pas encore passées (au moment du build) */
export const upcomingItems = (items: AgendaItem[]) => {
  const today = todayIso();
  return items.filter((item) => (item.end ?? item.date) >= today);
};

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// Les lignes ne doivent pas dépasser 75 octets (RFC 5545) : on les replie.
function fold(line: string) {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');

function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** « 10h30 » → 630 minutes ; undefined si l'heure n'est pas de cette forme */
function minutes(time?: string) {
  const m = time?.trim().match(/^(\d{1,2})\s*h\s*(\d{2})?$/i);
  if (!m) return undefined;
  const value = Number(m[1]) * 60 + Number(m[2] ?? 0);
  return value < 24 * 60 ? value : undefined;
}

/** Heures de début et de fin (en minutes), si la date a une heure précise */
function eventTimes(item: AgendaItem) {
  const start = item.end ? undefined : minutes(item.time);
  // Durée inconnue : une heure par défaut
  return start === undefined ? undefined : { start, end: Math.min(start + 60, 24 * 60 - 1) };
}

const hhmm = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}${String(value % 60).padStart(2, '0')}00`;

const timezone = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const description = (item: AgendaItem, times = eventTimes(item)) =>
  [!times && item.time ? `Heure : ${item.time}` : '', `${site.name} – https://saint-arnoux.fr/agenda/`].filter(Boolean).join('\n');

function event(item: AgendaItem, stamp: string) {
  const times = eventTimes(item);
  const lines = ['BEGIN:VEVENT', `UID:${itemKey(item)}@saint-arnoux.fr`, `DTSTAMP:${stamp}`];
  if (!times) {
    // Journée entière (ou plusieurs jours) : la fin est exclusive
    lines.push(`DTSTART;VALUE=DATE:${compact(item.date)}`, `DTEND;VALUE=DATE:${compact(nextDay(item.end ?? item.date))}`);
  } else {
    lines.push(
      `DTSTART;TZID=Europe/Paris:${compact(item.date)}T${hhmm(times.start)}`,
      `DTEND;TZID=Europe/Paris:${compact(item.date)}T${hhmm(times.end)}`,
    );
  }
  lines.push(`SUMMARY:${escape(item.title)}`);
  if (item.place) lines.push(`LOCATION:${escape(item.place)}`);
  lines.push(`DESCRIPTION:${escape(description(item, times))}`, 'END:VEVENT');
  return lines;
}

/** Contenu d'un fichier .ics regroupant les dates données (subscription : flux
    d'abonnement, avec une fréquence de mise à jour conseillée) */
export function toIcs(items: AgendaItem[], name: string, subscription = false) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paroisse Saint Arnoux//Agenda//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(name)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    ...(subscription ? ['REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H'] : []),
    ...timezone,
    ...items.flatMap((item) => event(item, stamp)),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export const icsResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });

const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

/** Une date au format attendu par add-to-calendar-button (src/lib/add-to-calendar.ts) */
export function calendarEvent(item: AgendaItem) {
  const times = eventTimes(item);
  return {
    name: item.title,
    startDate: item.date,
    ...(item.end && { endDate: item.end }),
    ...(times && { startTime: clock(times.start), endTime: clock(times.end) }),
    ...(item.place && { location: item.place }),
    description: description(item, times),
    uid: `${itemKey(item)}@saint-arnoux.fr`,
    icsFile: itemIcsUrl(item),
  };
}
