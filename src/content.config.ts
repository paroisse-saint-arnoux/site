// Collections de textes du site : tous les textes éditables sont des fichiers
// Markdown dans src/content/. Voir le README pour le mode d'emploi.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const markdown = (dossier: string) => glob({ pattern: '*.md', base: `./src/content/${dossier}` });

const lien = z.object({
  texte: z.string(),
  lien: z.string(),
  secondaire: z.boolean().optional(),
});

// Une page : titre, sur-titre et introduction communs, puis des champs
// propres à chaque page (raccourcis, formulaires, montants…).
const pages = defineCollection({
  loader: markdown('pages'),
  schema: z
    .object({
      titre: z.string(),
      surtitre: z.string().optional(),
      intro: z.string().optional(),
      description: z.string().optional(),
    })
    .loose(),
});

const histoire = defineCollection({
  loader: markdown('histoire'),
  schema: z.object({
    titre: z.string(),
    ordre: z.number(),
    image: z.string(),
    resume: z.string(),
  }),
});

const sacrements = defineCollection({
  loader: markdown('sacrements'),
  schema: z.object({
    titre: z.string(),
    ordre: z.number(),
    icone: z.string(),
    boutons: z.array(lien).default([]),
  }),
});

const activites = defineCollection({
  loader: markdown('activites'),
  schema: z.object({
    titre: z.string(),
    ordre: z.number(),
    public: z.string(),
    rubrique: z.string(),
  }),
});

export const collections = { pages, histoire, sacrements, activites };
