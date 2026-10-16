// Un fichier .ics par date de l'agenda : /ics/date/<date>-<titre>.ics
import type { APIRoute, GetStaticPaths } from 'astro';
import { agenda, type AgendaItem } from '../../../data/agenda';
import { icsResponse, itemKey, toIcs } from '../../../lib/ics';
import { site } from '../../../data/site';

export const getStaticPaths = (() => {
  const items = new Map<string, AgendaItem>();
  for (const item of agenda.flatMap((s) => s.items)) items.set(itemKey(item), item);
  return [...items].map(([key, item]) => ({ params: { key }, props: { item } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => icsResponse(toIcs([props.item as AgendaItem], site.name));
