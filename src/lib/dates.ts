import type { AgendaItem } from '../data/agenda';

const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);

const dayMonth = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const dayMonthYear = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const short = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Samedi 26 septembre » ou « Du 17 au 18 avril » */
export function formatDate(item: Pick<AgendaItem, 'date' | 'end'>, withYear = false) {
  if (item.end) return `Du ${short.format(parse(item.date))} au ${short.format(parse(item.end))}`;
  return capitalize((withYear ? dayMonthYear : dayMonth).format(parse(item.date)));
}

export function formatMonth(iso: string) {
  return capitalize(monthYear.format(parse(iso)));
}

export function dayNumber(iso: string) {
  return parse(iso).getUTCDate();
}

export function monthShort(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(parse(iso)).replace('.', '');
}

/** Date du jour à Paris, au format AAAA-MM-JJ */
export function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

export function itemDetails(item: AgendaItem) {
  return [item.time, item.place].filter(Boolean).join(' · ');
}
