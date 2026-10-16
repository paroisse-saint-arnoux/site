# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static brochure site for the Catholic parish Saint Arnoux (saint-arnoux.fr), built with **Astro 7**, hosted on O2switch (Apache/PHP shared hosting). All user-facing text, comments and docs are in **French**; keep it that way. `README.md` covers day-to-day content editing, `INSTALL.md` covers hosting, Mailchimp, the contact form and the deploy pipeline.

## Commands

```sh
npm run dev       # dev server (Astro 7 runs it as a background daemon; `npx astro dev stop` to stop)
npm run build     # static output in dist/ — this is the only check (no tests, no linter)
npm run preview   # serve dist/ (also a daemon; `npx astro preview stop`)
```

- Restart `astro dev` after changing `src/content.config.ts` or `astro.config.mjs`; otherwise collections are missing ("Texte introuvable : src/content/pages/…").
- `public/contact.php` can't run under `astro dev`. Test it with `php -l` and `php -S 127.0.0.1:8765 -t dist` with a fake `sendmail_path`. The PHP built-in server is single-threaded, so use `astro preview` for screenshots.
- Deploy: every push to `main` triggers `.github/workflows/deploy.yml` (build + FTPS upload of `dist/` via SamKirkland/FTP-Deploy-Action; secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`; optional `FTP_SERVER_DIR`, relative to the FTP account root, default `./`). Pushing to `main` therefore publishes the live site.

## Architecture

**Content is separated from templates; editors only touch Markdown/YAML.** Pages in `src/pages/*.astro` contain layout and markup only; their text comes from:

- `src/content/` – Astro content collections defined in `src/content.config.ts` (glob loader, `astro/zod` schemas):
  - `pages/<id>.md`: one file per page. The front matter holds titles and short strings, including page-specific nested fields (the schema is `.loose()`). The body is the page's main prose, rendered with `<Content />`. Load a page with `getPage(id)` from `src/lib/content.ts`, which returns `{ data, Content }`. The mass schedule (summer/winter `saisons`, `devotions`) lives in the front matter of `pages/horaires.md`, the Enoria sign-up links in `pages/activites.md`, and the channel card texts (used by `Channels.astro` and `NewsletterForm.astro`) in `pages/restez-informes.md`.
  - `sacrements/`, `activites/`, `histoire/`: one card or article per file, sorted by an `ordre` field (`getOrdered()`). Each `activites/*.md` names an agenda `rubrique` whose dates are shown with it. History slugs come from the file names (`src/pages/histoire/[slug].astro`).
  - Front matter strings that need inline Markdown (links, bold) are rendered with `components/Markdown.astro` (uses `marked`).
- `src/data/agenda.yml` – the pastoral calendar (sections → dated items, French keys `date`/`fin`/`titre`/`heure`/`lieu`/`messe`/`accueil`). `src/data/agenda.ts` imports it with `?raw`, parses it with `yaml`, validates it by hand (it throws with a pointer to the faulty section and entry, which fails the build), and exposes English-keyed `AgendaItem`/`AgendaSection`. `messe: true` items feed "Messes et célébrations particulières" on `/horaires/`; `accueil: true` sections feed "Prochains rendez-vous" on the home page.
- `src/data/site.ts` – contact details, office hours, nav, Facebook/WhatsApp links, booklet PDF path.

**Markdown pipeline**: Astro 7 defaults to the Sätteri processor. This project sets `markdown.processor: unified({ rehypePlugins: [rehypeFigures] })` from `@astrojs/markdown-remark` in `astro.config.mjs`. `src/lib/rehype-figures.mjs` turns a paragraph containing only images into `<figure data-align>` blocks: the `#gauche`/`#droite` URL hash sets the alignment and the image title becomes the `<figcaption>`. It also adds `target="_blank"` to external links. History images are plain files in `public/histoire/` (not optimized); other photos are in `src/assets/photos/` and go through `astro:assets` `<Image>`.

**Dates without rebuilds**: `components/AgendaList.astro` renders `data-date` on each item; an inline script greys out or hides past items and applies a `limit` client-side, using today's date in Europe/Paris. Pages also filter past items at build time. `/horaires/` highlights the current season by checking whether Paris is on UTC+2 (summer time), both at build time and in the browser.

**Add to calendar**: `src/lib/ics.ts` builds iCalendar files at build time through `src/pages/ics/date/[key].ics.ts` (one per date, key = `date-slug-of-title`, also used as UID) and `src/pages/ics/[name].ics.ts` (one per agenda section plus `messes`, past dates excluded, and `agenda`, the whole year, the subscription feed behind the « S'abonner » button on `/agenda/`). `AgendaList` shows a calendar link on each future date and, with the `ics` and `name` props, an « Ajouter ces dates à mon agenda » link centred below the list. These links carry a `data-atcb` JSON config (`calendarEvent()`); `src/lib/add-to-calendar.ts` turns them into the add-to-calendar-button (ELv2 licence, version pinned) Apple/Google/Outlook/iCal choice, loading the library, its French locale and default style from our bundle on first hover/touch (never from its CDN). Without JS the link downloads the `.ics`. The library only accepts https `icsFile`s, so on http (dev) it generates the file itself. `heure` like `10h30` gives a one-hour event, otherwise an all-day one. `.htaccess` serves `.ics` as `text/calendar`.

**messes.info widget** on `/horaires/` is injected into the DOM (GWT script, not an iframe). Its markup is restyled and partly hidden via `:global(...)` selectors in `src/pages/horaires.astro`.

**Server side** is two PHP scripts. `public/contact.php` validates the POST, applies a honeypot (`website`) and a minimum fill time (`elapsed` ms, sent by the page's JS, client-measured to avoid clock skew), sends with `mail()` (From = domain address, Reply-To = sender), and redirects with 303 to `/contact/merci/` or `/contact/?erreur=1`. The subject list must stay identical in `$subjects` (PHP) and `subjects` in `src/pages/contact/index.astro`. `public/newsletter.php` follows the same pattern (honeypot, `elapsed`, 303 to `/newsletter/merci/`, `/newsletter/confirmation/` or `/restez-informes/?erreur=newsletter`). It upserts the member through the Mailchimp Marketing API: PUT `/lists/{id}/members/{md5}` with `status_if_new: subscribed`, so single opt-in, a deliberate choice for an elderly audience. People who had unsubscribed can't be re-subscribed directly, so they get a PATCH to `pending` (confirmation email) and are redirected to `/newsletter/confirmation/`. Any final status other than subscribed or pending (e.g. `cleaned`) is treated as an error. The API key is never in the repo: the deploy workflow writes `dist/newsletter.config.php` from the `MAILCHIMP_API_KEY` and `MAILCHIMP_AUDIENCE_ID` secrets after validating their format, and `.htaccess` denies web access to it. The config may also set `api_url`, used to point the script at a local mock API for tests. `public/.htaccess` forces HTTPS on the bare domain, sets the 404 page and redirects old WordPress URLs.

## Conventions and gotchas

- Astro collapses whitespace between a text line and a following inline tag on the next line; write `{' '}` before a link that starts a new line.
- Icons: `components/Icon.astro` takes a lucide-static export name (`Clock`, `MapPin`…) or `facebook`/`whatsapp`/`mailchimp` (simple-icons), resolved at build time.
- The header logo is the SVG from `src/assets/logo/`, imported as a component (the file itself is cropped); `public/favicon.svg` is a copy cropped to a square (with a `prefers-color-scheme: dark` rule turning it white), so update it by hand if the logo changes, then regenerate `public/favicon.ico` (16/32/48, coloured) and `public/apple-touch-icon.png` (180×180, white logo on `--blue`) from it, e.g. with `sharp` + `magick`. The footer shows the white Diocèse de Nice logo the same way.
- SVGs imported as components are inlined, so their `<style>` rules are global: exported files all use `.cls-1`, `.cls-2`… and override each other. Rename the classes with a unique prefix (the diocese logo uses `diocese-N`) and remove the `<title>` (otherwise shown as a tooltip).
- The `*:Zone.Identifier` files that WSL creates are gitignored and excluded from the FTP deploy.
