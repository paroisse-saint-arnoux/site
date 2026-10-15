<?php
/**
 * Inscription à la newsletter via l'API Mailchimp (hébergement O2switch).
 *
 * Reçoit le POST du formulaire de /restez-informes/ et inscrit directement la
 * personne dans l'audience Mailchimp (simple opt-in, sans e-mail de
 * confirmation). Seule exception : une personne qui s'était désinscrite doit,
 * selon les règles de Mailchimp, reconfirmer par e-mail.
 *
 * La clé d'API n'est pas dans le dépôt : elle est lue dans
 * newsletter.config.php, écrit sur le serveur par la GitHub Action à partir
 * des secrets MAILCHIMP_API_KEY et MAILCHIMP_AUDIENCE_ID (voir INSTALL.md).
 */

declare(strict_types=1);

const MIN_SECONDS = 3; // un humain met plus de 3 s à remplir le formulaire
const PAGE_OK = '/newsletter/merci/';
const PAGE_CONFIRMATION = '/newsletter/confirmation/';
const PAGE_ERREUR = '/restez-informes/?erreur=newsletter#newsletter';

function redirect(string $path): never
{
    header('Location: ' . $path, true, 303);
    exit;
}

function field(string $name, int $max): string
{
    $value = trim(preg_replace('/[\r\n\t]+/', ' ', (string) ($_POST[$name] ?? '')) ?? '');
    return mb_substr($value, 0, $max);
}

/** Appel à l'API Mailchimp ; renvoie [code HTTP, réponse décodée]. */
function mailchimp(array $config, string $method, string $path, array $body): array
{
    [, $dc] = explode('-', $config['api_key'], 2) + [1 => ''];
    $base = $config['api_url'] ?? "https://{$dc}.api.mailchimp.com/3.0";
    $curl = curl_init($base . $path);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_USERPWD => 'saint-arnoux:' . $config['api_key'],
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($curl);
    $code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return [$code, is_string($response) ? (json_decode($response, true) ?? []) : []];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    redirect('/restez-informes/');
}

// Pièges à robots : champ caché rempli, ou formulaire envoyé trop vite.
// On simule un succès pour ne rien leur apprendre.
$elapsed = isset($_POST['elapsed']) && $_POST['elapsed'] !== '' ? (int) $_POST['elapsed'] : null;
if (field('website', 200) !== '' || ($elapsed !== null && $elapsed < MIN_SECONDS * 1000)) {
    redirect(PAGE_OK);
}

$email = field('email', 160);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect(PAGE_ERREUR);
}

$configFile = __DIR__ . '/newsletter.config.php';
$config = is_file($configFile) ? require $configFile : null;
if (!is_array($config) || empty($config['api_key']) || empty($config['audience_id'])) {
    error_log('newsletter.php : newsletter.config.php absent ou incomplet');
    redirect(PAGE_ERREUR);
}

$member = '/lists/' . rawurlencode($config['audience_id']) . '/members/' . md5(mb_strtolower($email));

// Crée la personne si elle n'existe pas (inscrite directement), met à jour
// prénom et nom sinon.
[$code, $result] = mailchimp($config, 'PUT', $member, [
    'email_address' => $email,
    'status_if_new' => 'subscribed',
    'merge_fields' => (object) array_filter(['FNAME' => field('prenom', 80), 'LNAME' => field('nom', 80)]),
]);

// Personne désinscrite auparavant : Mailchimp interdit de la réinscrire
// directement, on lui envoie un e-mail de confirmation (statut « pending »).
if ($code === 200 && ($result['status'] ?? '') === 'unsubscribed') {
    [$code, $result] = mailchimp($config, 'PATCH', $member, ['status' => 'pending']);
}

$status = $result['status'] ?? '';
if ($code !== 200 || !in_array($status, ['subscribed', 'pending'], true)) {
    // Par ex. adresse « cleaned » (rejetée par les serveurs de messagerie)
    error_log('newsletter.php : Mailchimp ' . $code . ' ' . ($result['title'] ?? $status) . ' – ' . ($result['detail'] ?? ''));
    redirect(PAGE_ERREUR);
}

redirect($status === 'pending' ? PAGE_CONFIRMATION : PAGE_OK);
