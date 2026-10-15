<?php
/**
 * Envoi du formulaire de contact par e-mail (hébergement O2switch).
 *
 * Le site étant statique, ce script est le seul code exécuté côté serveur.
 * Il reçoit le POST de /contact/, vérifie les champs et envoie le message à
 * la paroisse avec mail(). L'expéditeur est une adresse du domaine (pour que
 * SPF/DKIM soient valides) et la réponse se fait via Reply-To.
 */

declare(strict_types=1);

// --- Configuration ----------------------------------------------------------
const MAIL_TO = 'paroisse.starnoux@nice.catholique.fr';
const MAIL_FROM = 'site@saint-arnoux.fr';
const MAIL_FROM_NAME = 'Site de la paroisse Saint Arnoux';
const MIN_SECONDS = 3; // un humain met plus de 3 s à remplir le formulaire

$subjects = [
    'renseignement' => 'Demande de renseignement',
    'bapteme' => 'Baptême',
    'mariage' => 'Mariage',
    'confirmation' => 'Confirmation',
    'obseques' => 'Obsèques',
    'intention' => 'Intention de messe',
    'activites' => 'Catéchisme, aumônerie, activités',
    'autre' => 'Autre',
];
// ---------------------------------------------------------------------------

function redirect(string $path): never
{
    header('Location: ' . $path, true, 303);
    exit;
}

function field(string $name, int $max): string
{
    $value = trim((string) ($_POST[$name] ?? ''));
    return mb_substr($value, 0, $max);
}

function oneLine(string $value): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $value) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    redirect('/contact/');
}

// Pièges à robots : champ caché rempli, ou formulaire envoyé trop vite.
// On simule un succès pour ne rien leur apprendre.
// `elapsed` (en ms) est mesuré par le navigateur ; absent si JavaScript est désactivé.
$elapsed = isset($_POST['elapsed']) && $_POST['elapsed'] !== '' ? (int) $_POST['elapsed'] : null;
if (field('website', 200) !== '' || ($elapsed !== null && $elapsed < MIN_SECONDS * 1000)) {
    redirect('/contact/merci/');
}

$name = oneLine(field('name', 120));
$email = oneLine(field('email', 160));
$phone = oneLine(field('phone', 30));
$subjectKey = field('subject', 40);
$message = field('message', 5000);
$consent = ($_POST['consent'] ?? '') === '1';

if (
    $name === ''
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || !isset($subjects[$subjectKey])
    || mb_strlen($message) < 5
    || !$consent
) {
    redirect('/contact/?erreur=1');
}

$subject = '[Site] ' . $subjects[$subjectKey] . ' – ' . $name;

$body = "Message envoyé depuis le formulaire de contact du site saint-arnoux.fr\n"
    . str_repeat('-', 60) . "\n"
    . "Nom : {$name}\n"
    . "E-mail : {$email}\n"
    . 'Téléphone : ' . ($phone !== '' ? $phone : '–') . "\n"
    . "Objet : {$subjects[$subjectKey]}\n"
    . str_repeat('-', 60) . "\n\n"
    . $message . "\n";

$encode = static fn (string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';

$headers = [
    'From' => $encode(MAIL_FROM_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To' => $encode($name) . ' <' . $email . '>',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'saint-arnoux.fr',
];

$sent = mail(MAIL_TO, $encode($subject), $body, $headers, '-f' . MAIL_FROM);

redirect($sent ? '/contact/merci/' : '/contact/?erreur=1');
