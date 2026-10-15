# Installation et mise en ligne

Ce document décrit la mise en place complète du site : poste de travail, hébergement O2switch, formulaire de contact, newsletter Mailchimp et publication automatique par GitHub Actions.

Pour la mise à jour des textes au quotidien, voir le [README](README.md).

---

## 1. Poste de travail

Prérequis : [Node.js](https://nodejs.org) **22.12 ou plus récent**, et Git.

```sh
git clone https://github.com/paroisse-saint-arnoux/site.git
cd site
npm install
npm run dev        # site de développement sur http://localhost:4321
```

- `npm run build` génère le site final dans `dist/` ; `npm run preview` permet de le consulter.
- Après une modification de `src/content.config.ts` ou de `astro.config.mjs`, arrêter puis relancer `npm run dev` (les modifications des fichiers `.md` et `.yml` sont prises en compte directement).
- Le formulaire de contact (PHP) ne fonctionne pas avec `npm run dev` : il se teste sur le serveur (voir §3).

---

## 2. Hébergement O2switch

Dans le cPanel d'O2switch :

1. **Domaine** : `saint-arnoux.fr` doit pointer vers le dossier `public_html/` (ou le dossier choisi pour le site).
2. **HTTPS** : activer le certificat (menu *Let's Encrypt SSL* ou *AutoSSL*) pour `saint-arnoux.fr` **et** `www.saint-arnoux.fr`. Le fichier `.htaccess` du site redirige ensuite automatiquement vers `https://saint-arnoux.fr`.
3. **PHP** : version **8.1 ou plus récente** (menu *Sélectionner une version de PHP*), nécessaire au script `contact.php`.

### Passage depuis l'ancien site WordPress

Avant la première publication :

- faire une **sauvegarde complète** de l'ancien site (fichiers et base de données) depuis le cPanel ;
- vider (ou renommer) l'ancien dossier du site, pour qu'il ne reste pas de fichiers WordPress accessibles.

Les anciennes adresses les plus utilisées (`/horaires-de-messes/`, `/inscription-aux-activites/`, `/demander-un-sacrement/`, `/inscription-aux-mails/`, pages d'histoire…) sont redirigées vers les nouvelles par le `.htaccess` (fichier `public/.htaccess`).

---

## 3. Formulaire de contact

Le formulaire de la page `/contact/` envoie les messages grâce au script `public/contact.php`, avec la fonction `mail()` de PHP.

### Configuration

En tête de `public/contact.php` :

```php
const MAIL_TO = 'paroisse.starnoux@nice.catholique.fr';   // destinataire des messages
const MAIL_FROM = 'site@saint-arnoux.fr';                 // expéditeur
const MAIL_FROM_NAME = 'Site de la paroisse Saint Arnoux';
```

- `MAIL_TO` : l'adresse qui reçoit les messages (on peut en mettre plusieurs, séparées par une virgule).
- `MAIL_FROM` : doit être **une adresse du domaine saint-arnoux.fr**, sinon les messages risquent d'être classés en indésirables. Créer cette adresse dans le cPanel (menu *Comptes de messagerie*), même si personne ne la consulte.
- La personne qui écrit est placée en « Répondre à » : il suffit de cliquer sur *Répondre* pour lui écrire.

### Délivrabilité

Dans le cPanel, menu *Email Deliverability* (ou *Délivrabilité des e-mails*) : vérifier que **SPF** et **DKIM** sont valides pour `saint-arnoux.fr`, et cliquer sur *Réparer* si besoin.

### Test

Après la mise en ligne, envoyer un message depuis `https://saint-arnoux.fr/contact/` :

- la page « Votre message a bien été envoyé » doit s'afficher ;
- le message doit arriver à `MAIL_TO` (vérifier aussi le dossier des indésirables).

En cas d'échec, la page de contact affiche un message d'erreur ; consulter alors le journal d'erreurs PHP dans le cPanel (*Métriques › Erreurs*).

### Protection contre le spam

Sans réglage nécessaire : un champ caché piège les robots, et les formulaires remplis en moins de 3 secondes sont ignorés (`MIN_SECONDS` dans `contact.php`). Dans les deux cas, le robot voit une page de succès mais aucun e-mail n'est envoyé.

### Objets du message

La liste « Objet » du formulaire est définie à deux endroits qui doivent rester identiques : `$subjects` dans `public/contact.php`, et `subjects` dans `src/pages/contact/index.astro`.

---

## 4. Newsletter Mailchimp

Le formulaire d'inscription (page `/restez-informes/`) envoie directement les inscriptions à Mailchimp ; aucune clé secrète n'est nécessaire.

1. Dans Mailchimp : *Audience › Signup forms › Embedded forms*.
2. Dans le code proposé, repérer la balise `<form action="…">` et copier l'adresse de `action`. Elle ressemble à :
   `https://xxxx.us21.list-manage.com/subscribe/post?u=XXXXXXXXXXXX&id=YYYYYYYYYY`
3. La coller dans `src/data/site.ts` :

   ```ts
   mailchimpAction: 'https://xxxx.us21.list-manage.com/subscribe/post?u=XXXXXXXXXXXX&id=YYYYYYYYYY',
   ```

4. Vérifier que l'audience Mailchimp contient bien les champs `FNAME` (prénom) et `LNAME` (nom), présents par défaut.

Tant que `mailchimpAction` est vide, la page « Restez informés » invite simplement à écrire à la paroisse pour s'inscrire.

Après une inscription, Mailchimp ouvre sa propre page de confirmation dans un nouvel onglet (et envoie un e-mail de confirmation si le double opt-in est activé).

---

## 5. Publication automatique (GitHub Actions)

À chaque push sur `main`, le fichier `.github/workflows/deploy.yml` construit le site et l'envoie sur O2switch en FTPS. Seuls les fichiers modifiés sont envoyés ; la liste des fichiers publiés est conservée sur le serveur dans `.ftp-deploy-sync-state.json` (ne pas le supprimer).

### a. Créer un compte FTP dédié

Dans le cPanel, menu *Comptes FTP* : créer un compte (par ex. `deploy@saint-arnoux.fr`) dont le dossier est le dossier du site. Noter :

- le serveur FTP (par ex. `ftp.saint-arnoux.fr`, ou le nom du serveur O2switch indiqué dans le cPanel) ;
- l'identifiant complet et le mot de passe ;
- le dossier d'arrivée du compte, pour régler `FTP_SERVER_DIR` (voir ci-dessous).

### b. Renseigner les secrets dans GitHub

Sur GitHub : *Settings › Secrets and variables › Actions*.

Onglet **Secrets** (*New repository secret*) :

| Nom | Valeur |
| --- | --- |
| `FTP_SERVER` | serveur FTP, par ex. `ftp.saint-arnoux.fr` |
| `FTP_USERNAME` | identifiant du compte FTP |
| `FTP_PASSWORD` | mot de passe du compte FTP |

Facultatif, dans l'onglet **Variables** (ou en secret) :

| Nom | Valeur |
| --- | --- |
| `FTP_SERVER_DIR` | dossier de destination **relatif au dossier d'arrivée du compte FTP**, avec un `/` final. Par défaut `./` (le compte FTP s'ouvre directement dans le dossier du site). Si le compte s'ouvre dans le dossier personnel, mettre `public_html/` |

### c. Première publication

- Pousser un commit sur `main`, ou lancer l'action à la main : onglet *Actions › Publication du site › Run workflow*.
- Suivre l'exécution dans l'onglet *Actions* ; en cas d'échec, le détail de l'étape « Envoi par FTP » indique la cause (identifiants, dossier…).
- Si la connexion chiffrée est refusée, remplacer `protocol: ftps` par `protocol: ftp` dans `.github/workflows/deploy.yml`.

### d. Remarques

- Un fichier supprimé du site est aussi supprimé du serveur à la publication suivante (uniquement les fichiers publiés par l'action).
- Une erreur dans les textes (par ex. une date mal écrite dans `agenda.yml`) fait échouer la construction : rien n'est alors publié, et l'erreur est indiquée dans l'onglet *Actions*.
- Les dates passées de l'agenda sont masquées dans le navigateur ; il n'est donc pas nécessaire de republier le site pour les faire disparaître.

---

## 6. Autres réglages

- **Horaires des messes (messes.info)** : le module affiché sur `/horaires/` est celui de la communauté `nc/06/saint-pierre-du-brusc`. Sur la fiche messes.info, mettre à jour le **site web** (`https://saint-arnoux.fr`) et vérifier l'**adresse** du Centre Saint Joseph (la fiche indique « 98 Route de Nice »).
- **Facebook et WhatsApp** : liens dans `src/data/site.ts` (`channels`).
- **Coordonnées et permanences** : `src/data/site.ts` (`contact`, `permanences`) ; les mentions légales sont dans `src/content/pages/mentions-legales.md`.
- **Livret paroissial** : remplacer le PDF dans `public/` et mettre à jour `livret` dans `src/data/site.ts`.

---

## 7. Vérifications après la mise en ligne

- [ ] `http://saint-arnoux.fr` et `https://www.saint-arnoux.fr` redirigent vers `https://saint-arnoux.fr`
- [ ] Une ancienne adresse (par ex. `/horaires-de-messes/`) redirige vers la nouvelle page
- [ ] Une adresse inexistante affiche la page « Cette page n'existe pas »
- [ ] Le module messes.info s'affiche sur `/horaires/`
- [ ] Un message envoyé depuis `/contact/` arrive bien à la paroisse
- [ ] L'inscription à la newsletter apparaît dans l'audience Mailchimp
- [ ] Les liens d'inscription (Enoria) des pages Activités et Sacrements fonctionnent
- [ ] Le livret PDF se télécharge
