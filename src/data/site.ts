// Informations générales de la paroisse : à mettre à jour ici, elles sont
// reprises dans l'en-tête, le pied de page et les pages du site.

export const site = {
  name: 'Paroisse Saint Arnoux',
  tagline: 'Saint Pierre du Brusc & Saint Antoine de Padoue',
  description:
    'Paroisse catholique de Roquefort-les-Pins, Le Rouret, Opio, Châteauneuf-Grasse, Le Bar-sur-Loup, Gourdon, Cipières, Gréolières, Courmes et Pont-du-Loup.',
  villages: [
    'Roquefort-les-Pins',
    'Le Rouret',
    'Opio',
    'Châteauneuf-Grasse',
    'Le Bar-sur-Loup',
    'Pont-du-Loup',
    'Gourdon',
    'Courmes',
    'Cipières',
    'Gréolières',
  ],
};

export const contact = {
  place: 'Centre Saint Joseph',
  street: '1104 route de Nice',
  city: '06650 Le Rouret',
  phone: '04 93 77 28 33',
  phoneHref: 'tel:+33493772833',
  email: 'paroisse.starnoux@nice.catholique.fr',
  mapUrl: 'https://www.openstreetmap.org/search?query=1104%20route%20de%20Nice%2C%2006650%20Le%20Rouret',
};

// Permanences d'accueil (hors jours fériés et vacances scolaires)
export const permanences = [
  { day: 'Mardi', slots: ['14h – 16h', '17h – 19h'] },
  { day: 'Mercredi', slots: ['15h30 – 17h30'] },
  { day: 'Jeudi', slots: ['10h – 12h'] },
  { day: 'Vendredi', slots: ['10h – 12h'] },
];

export const channels = {
  facebook: 'https://www.facebook.com/saint.arnoux',
  whatsapp: 'https://chat.whatsapp.com/DCCE5OTwmPI0iyaTn9hJhs',
};

export const livret = {
  title: 'Livret paroissial 2026-2027',
  url: '/livret-paroissial-2026-2027.pdf',
};

export const nav = [
  { href: '/horaires/', label: 'Horaires des messes' },
  { href: '/agenda/', label: 'Agenda' },
  { href: '/activites/', label: 'Activités' },
  { href: '/sacrements/', label: 'Sacrements' },
  { href: '/histoire/', label: 'Histoire' },
  { href: '/contact/', label: 'Contact' },
];
