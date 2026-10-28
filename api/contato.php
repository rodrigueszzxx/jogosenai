<?php
header('Content-Type: application/json; charset=utf-8');
session_start([
    'cookie_httponly' => true, 'cookie_samesite' => 'Lax',
    'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
]);
function responderContato(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['status' => $status < 400 ? 'success' : 'error', 'message' => $message]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') responderContato(405, 'Use o formulário para enviar uma mensagem.');
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) responderContato(400, 'Dados inválidos.');
$token = $input['token'] ?? null;
if (!is_string($token) || !isset($_SESSION['contact_token']) || !hash_equals($_SESSION['contact_token'], $token)) {
    responderContato(403, 'Atualize a página e tente novamente.');
}
if (!empty($input['website'])) responderContato(400, 'Não foi possível enviar a mensagem.');
foreach (['nome','email','assunto','mensagem'] as $field) {
    if (!isset($input[$field]) || !is_string($input[$field])) responderContato(422, 'Preencha todos os campos.');
    $input[$field] = trim($input[$field]);
}
if (mb_strlen($input['nome']) < 2 || mb_strlen($input['nome']) > 80
    || !filter_var($input['email'], FILTER_VALIDATE_EMAIL) || strlen($input['email']) > 254
    || !in_array($input['assunto'], ['Sugestão de personagem','Feedback do jogo','Problema técnico','Trabalhe conosco','Outro'], true)
    || mb_strlen($input['mensagem']) < 10 || mb_strlen($input['mensagem']) > 2000
    || ($input['consentimento'] ?? false) !== true) {
    responderContato(422, 'Confira o nome, o e-mail, a mensagem (10 a 2.000 caracteres) e a autorização de contato.');
}
if (time() - ($_SESSION['contact_last_sent'] ?? 0) < 30) responderContato(429, 'Aguarde 30 segundos antes de enviar outra mensagem.');
require_once __DIR__ . '/../config/database.php';
try {
    $pdo = conectarBanco();
    $pdo->exec('CREATE TABLE IF NOT EXISTS mensagens_contato (
        id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL,
        email VARCHAR(254) NOT NULL, assunto VARCHAR(80) NOT NULL,
        mensagem TEXT NOT NULL, data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )');
    $stmt = $pdo->prepare('INSERT INTO mensagens_contato (nome,email,assunto,mensagem) VALUES (?,?,?,?)');
    $stmt->execute([$input['nome'],$input['email'],$input['assunto'],$input['mensagem']]);
    $_SESSION['contact_last_sent'] = time();
    responderContato(201, 'Mensagem registrada! Obrigado por contribuir com a VORTEX.');
} catch (PDOException $e) {
    responderContato(503, 'Não foi possível registrar agora. Seu texto foi mantido; tente novamente mais tarde.');
}
