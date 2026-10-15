# Site de la paroisse Saint Arnoux

Site vitrine statique de la paroisse ([saint-arnoux.fr](https://saint-arnoux.fr)), construit avec [Astro](https://astro.build) et hébergé chez O2switch.

## Développement

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # génère le site dans dist/
```

Première installation : voir [INSTALL.md](INSTALL.md).

## Mettre à jour le contenu

### Les textes : `src/content/` (Markdown)

Tous les textes du site sont des fichiers Markdown (`.md`). Chaque fichier commence par un **en-tête** entre deux lignes `---` (titres, phrases courtes, listes), suivi du **texte** proprement dit.

| Dossier | Contenu |
| --- | --- |
| `pages/` | Un fichier par page : `accueil.md`, `horaires.md` (dont les horaires d'été et d'hiver), `activites.md` (dont les liens d'inscription), `sacrements.md` (dont le casuel), `contact.md`, `restez-informes.md`, `mentions-legales.md`… |
| `sacrements/` | Une carte par sacrement (texte, icône, boutons) |
| `activites/` | Une activité par fichier ; `rubrique` indique les dates de l'agenda à afficher |
| `histoire/` | Une page d'histoire par fichier ; le nom du fichier donne l'adresse (`/histoire/<nom>/`) |

Rappels Markdown : `**gras**`, `*italique*`, `[texte du lien](https://…)`, `## Intertitre`, une ligne vide entre deux paragraphes, `1.` ou `-` pour les listes.

Images dans le texte (pages d'histoire) : `![description](/histoire/photo.jpg "Légende")`, placées dans `public/histoire/`. Ajouter `#gauche` ou `#droite` après le nom du fichier pour placer l'image à côté du texte : `![](/histoire/photo.jpg#droite "Légende")`.

Dans l'en-tête, mettre une phrase entre guillemets si elle contient « : ». Pour ajouter une carte (sacrement, activité, page d'histoire), copier un fichier existant et changer son contenu ; `ordre` fixe la position.

### Les données : `src/data/`

| Fichier | Contenu |
| --- | --- |
| `agenda.yml` | Calendrier pastoral de l'année (repris du livret paroissial) – mode d'emploi en tête du fichier |
| `site.ts` | Coordonnées, permanences, liens Facebook / WhatsApp, menu |

- **Horaires des messes** : les horaires habituels sont dans `src/content/pages/horaires.md` (la saison en cours est mise en avant automatiquement au changement d'heure). En dessous, le widget de [messes.info](https://messes.info/communaute/nc/06/saint-pierre-du-brusc) affiche le détail des prochaines célébrations, à tenir à jour sur messes.info.
- Dans `agenda.yml`, `messe: true` fait apparaître un événement dans « Messes et célébrations particulières » (page Horaires), et les rubriques `accueil: true` alimentent « Prochains rendez-vous » sur l'accueil. Les dates passées sont grisées ou masquées automatiquement dans le navigateur, sans avoir à reconstruire le site. Une erreur de saisie (date mal écrite, champ manquant) fait échouer `npm run build` avec un message indiquant la ligne en cause.
- Livret de l'année : remplacer `public/livret-paroissial-2026-2027.pdf` (et `livret` dans `site.ts`).
- Photos : `src/assets/photos/` ; elles sont redimensionnées et converties en WebP au build.
- Image de partage (aperçu Facebook, WhatsApp…) : `public/og-image.jpg`, générée à partir de `scripts/og-image.html`. Après avoir changé la photo d'accueil ou le logo, la régénérer avec `bash scripts/og-image.sh` (nécessite Chrome et ImageMagick).

## Installation, configuration et publication

Voir [INSTALL.md](INSTALL.md) : hébergement O2switch, formulaire de contact, newsletter Mailchimp, publication automatique par GitHub Actions et vérifications après la mise en ligne.

En résumé, chaque push sur `main` publie automatiquement le site sur O2switch.
