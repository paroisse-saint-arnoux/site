// Un fichier .ics par rubrique de l'agenda (/ics/<id>.ics) et un pour les
// messes et célébrations particulières (/ics/messes.ics), sans les dates
// déjà passées au moment du build. /ics/agenda.ics contient toute l'année :
// c'est le flux auquel on s'abonne (bouton « S'abonner » de la page Agenda).
import type { APIRoute, GetStaticPaths } from 'astro';
import { agenda, type AgendaItem } from '../../data/agenda';
import { icsResponse, itemKey, toIcs, upcomingItems } from '../../lib/ics';
import { site } from '../../data/site';

const unique = (items: AgendaItem[]) => items.filter((item, i, all) => all.findIndex((o) => itemKey(o) === itemKey(item)) === i);

export const getStaticPaths = (() => {
  const all = agenda.flatMap((s) => s.items);
  return [
    ...agenda.map((s) => ({ params: { name: s.id }, props: { title: s.title, items: s.items } })),
    { params: { name: 'messes' }, props: { title: 'Messes et célébrations particulières', items: unique(all.filter((item) => item.messe)) } },
    { params: { name: 'agenda' }, props: { title: '', items: unique(all), subscription: true } },
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { title, items, subscription } = props as { title: string; items: AgendaItem[]; subscription?: boolean };
  return subscription
    ? icsResponse(toIcs(items, site.name, true))
    : icsResponse(toIcs(upcomingItems(items), `${site.name} – ${title}`));
};
