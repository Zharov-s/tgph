<?php
header('Content-Type: application/json; charset=utf-8');
if(function_exists('mb_internal_encoding')){
    mb_internal_encoding('UTF-8');
}

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    echo json_encode(['success' => false, 'error' => 'method']);
    exit;
}

if (!empty($_POST['website'])) {
    echo json_encode(['success' => false, 'error' => 'bot']);
    exit;
}

function field($name){
    return isset($_POST[$name]) ? trim(strip_tags((string)$_POST[$name])) : '';
}

$to = 'dyardgrupp@gmail.com';
$source = field('source') ?: 'Форма на сайте';
$name = field('name');
$phone = field('phone');
$emailRaw = field('email');
$email = '';
if($emailRaw){
    $validated = filter_var($emailRaw, FILTER_VALIDATE_EMAIL);
    if($validated){
        $email = $validated;
    }
}
$company = field('company');
$message = field('message');

$rentFormat = field('rent_format');
$rentTerm   = field('rent_term');

$eventFormat = field('event_format');
$eventFormatCustom = field('event_format_custom');
$dateFrom = field('date_from');
$dateTo = field('date_to');
$hoursPerDay = field('hours_per_day');

$isCoworking = !empty($rentTerm) || !empty($rentFormat);
$isEvent = !empty($eventFormat) || !empty($eventFormatCustom);

if(!$name || !$phone){
    echo json_encode(['success' => false, 'error' => 'required']);
    exit;
}

$lines = [];
$lines[] = 'Новая заявка с сайта Telegraph';
$lines[] = 'Отправлено: '.date('d.m.Y H:i');
$lines[] = '';
$lines[] = 'Источник: '.$source;
$lines[] = 'Имя: '.$name;
$lines[] = 'Телефон: '.$phone;
if($email) $lines[] = 'Email: '.$email;
if($company) $lines[] = 'Компания: '.$company;

if($isCoworking){
    $lines[] = '';
    $lines[] = '=== Коворкинг ===';
    if($rentFormat) $lines[] = 'Формат: '.$rentFormat;
    if($rentTerm) $lines[] = 'Срок аренды: '.$rentTerm;
} elseif($isEvent){
    $lines[] = '';
    $lines[] = '=== Конференц-зал ===';
    $formatText = $eventFormatCustom ?: $eventFormat;
    $lines[] = 'Формат мероприятия: '.$formatText;
    if($dateFrom) $lines[] = 'Дата от: '.$dateFrom;
    if($dateTo) $lines[] = 'Дата до: '.$dateTo;
    if($hoursPerDay) $lines[] = 'Часов в день: '.$hoursPerDay;
} else {
    $lines[] = '';
    $lines[] = 'Детали: формат не указан';
}

if($message) {
    $lines[] = '';
    $lines[] = 'Комментарий:';
    $lines[] = $message;
}

$body = implode("\n", $lines)."\n";

$domain = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'telegraph-site';
$from = 'no-reply@'.$domain;

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/plain; charset=utf-8\r\n";
$headers .= 'From: Telegraph <'.$from.">\r\n";
if($email){
    $headers .= 'Reply-To: '.$email."\r\n";
}

$encodedSubject = '=?UTF-8?B?'.base64_encode('Заявка с сайта — '.$source).'?=';
$ok = @mail($to, $encodedSubject, $body, $headers);

if(!$ok){
    echo json_encode(['success' => false, 'error' => 'send']);
    exit;
}

echo json_encode(['success' => true]);
