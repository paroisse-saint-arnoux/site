import { getCollection, getEntry, render } from 'astro:content';

/** Page de src/content/pages/<id>.md, avec son texte rendu (Content). */
export async function getPage(id: string) {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Texte introuvable : src/content/pages/${id}.md`);
  const { Content } = await render(page);
  // Champs propres à chaque page (raccourcis, canaux…), voir le fichier .md
  const data = page.data as typeof page.data & Record<string, any>;
  return { data, Content, hasBody: Boolean(page.body?.trim()) };
}

/** Fichiers d'une collection (histoire, sacrements, activites), triés par « ordre ». */
export async function getOrdered<C extends 'histoire' | 'sacrements' | 'activites'>(collection: C) {
  const entries = await getCollection(collection);
  return entries.sort((a, b) => a.data.ordre - b.data.ordre);
}

export { render };
