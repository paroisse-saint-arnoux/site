// Charge et vérifie le calendrier pastoral (src/data/agenda.yml).
// Une erreur de saisie dans le fichier YAML fait échouer le build avec un
// message indiquant la rubrique et la date en cause.
import { parse } from 'yaml';
import source from './agenda.yml?raw';

export type AgendaItem = {
  date: string;
  end?: string;
  title: string;
  time?: string;
  place?: string;
  messe?: boolean;
  /** Texte Markdown affiché sous la date tant qu'elle n'est pas passée */
  programme?: string;
};

export type AgendaSection = {
  id: string;
  title: string;
  intro?: string;
  home?: boolean;
  items: AgendaItem[];
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function fail(where: string, message: string): never {
  throw new Error(`agenda.yml, ${where} : ${message}`);
}

function text(value: unknown, where: string, field: string, required = false): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) fail(where, `le champ « ${field} » est obligatoire`);
    return undefined;
  }
  return String(value);
}

function day(value: unknown, where: string, field: string): string {
  const s = String(value);
  if (!isoDate.test(s) || Number.isNaN(Date.parse(s))) fail(where, `« ${field}: ${s} » n'est pas une date au format AAAA-MM-JJ`);
  return s;
}

const data = parse(source) as { annee?: unknown; rubriques?: unknown };
if (!Array.isArray(data?.rubriques)) fail('début du fichier', 'la liste « rubriques » est introuvable');

export const year = String(data.annee ?? '');

export const agenda: AgendaSection[] = data.rubriques.map((raw: any, i: number) => {
  const id = text(raw?.id, `rubrique n°${i + 1}`, 'id', true)!;
  if (!Array.isArray(raw.dates)) fail(`rubrique « ${id} »`, 'la liste « dates » est introuvable');
  return {
    id,
    title: text(raw.titre, `rubrique « ${id} »`, 'titre', true)!,
    intro: text(raw.intro, `rubrique « ${id} »`, 'intro'),
    home: raw.accueil === true,
    items: raw.dates.map((d: any, j: number) => {
      const where = `rubrique « ${id} », date n°${j + 1}`;
      return {
        date: day(d?.date, where, 'date'),
        end: d.fin ? day(d.fin, where, 'fin') : undefined,
        title: text(d.titre, where, 'titre', true)!,
        time: text(d.heure, where, 'heure'),
        place: text(d.lieu, where, 'lieu'),
        messe: d.messe === true,
        programme: text(d.programme, where, 'programme')?.trim(),
      };
    }),
  };
});

export const sectionById = (id: string) => {
  const section = agenda.find((s) => s.id === id);
  if (!section) throw new Error(`Rubrique d'agenda inconnue : ${id}`);
  return section;
};
