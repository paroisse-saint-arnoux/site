// Boutons « Ajouter à mon agenda » : tout élément portant data-atcb (une
// configuration add-to-calendar-button en JSON) ouvre, au clic, le choix
// Apple / Google / Outlook / fichier iCal adapté au téléphone ou à l'ordinateur.
// Ces éléments sont des liens vers un fichier .ics : sans JavaScript, ou si la
// bibliothèque ne se charge pas, le lien fonctionne tel quel.
//
// La bibliothèque, sa traduction et son style sont chargés à la demande
// depuis notre propre site (aucun appel à un CDN).

type Config = Record<string, unknown> & { icsFile?: string; dates?: Config[] };

const load = () =>
  Promise.all([
    import('add-to-calendar-button'),
    import('add-to-calendar-button/i18n/fr'),
    import('add-to-calendar-button/styles/default'),
  ]).then(([lib]) => lib.atcb_action);

let library: ReturnType<typeof load> | undefined;
const preload = () => (library ??= load());

// La bibliothèque n'accepte que des fichiers .ics en https : en local (http),
// elle génère elle-même le fichier.
function absolute(config: Config) {
  if (config.icsFile) {
    if (location.protocol === 'https:') config.icsFile = new URL(config.icsFile, location.origin).href;
    else if (config.subscribe) config.icsFile = new URL(config.icsFile, 'https://saint-arnoux.fr').href;
    else delete config.icsFile;
  }
  config.dates?.forEach(absolute);
  return config;
}

const common = {
  language: 'fr',
  timeZone: 'Europe/Paris',
  listStyle: 'modal',
  lightMode: 'light',
  options: ['apple', 'google', 'outlookcom', 'ical'],
  optionsIOS: ['apple', 'google'],
  optionsMobile: ['google', 'ical'],
  customLabels: { 'label.addtocalendar': 'Ajouter à mon agenda' },
};

document.querySelectorAll<HTMLElement>('[data-atcb]').forEach((trigger) => {
  // Chargée dès que l'on s'approche d'un bouton, pour que le clic réagisse aussitôt
  for (const type of ['pointerenter', 'touchstart', 'focus']) trigger.addEventListener(type, preload, { once: true, passive: true });

  trigger.addEventListener('click', async (event) => {
    event.preventDefault();
    const own = absolute(JSON.parse(trigger.dataset.atcb!));
    // Dates passées depuis la mise en ligne du site
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
    if (own.dates) own.dates = own.dates.filter((d) => String(d.endDate ?? d.startDate) >= today);
    // Abonnement sur Android : seul Google Agenda sait s'abonner
    const config = { ...common, ...(own.subscribe ? { optionsMobile: ['google'] } : {}), ...own };
    try {
      const action = await preload();
      await action(config, trigger);
    } catch (error) {
      console.error(error);
      const href = trigger.getAttribute('href');
      if (href) location.href = href;
    }
  });
});
