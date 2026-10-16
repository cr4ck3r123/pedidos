<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/syncpay.php';
requireMethod('GET');

try {
    $onlinePaymentsEnabled = true;
    $onlinePaymentsReason = null;
    $onlinePaymentsMessage = null;
    $syncPayConfig = null;
    try {
        $syncPayConfig = syncPayConfig();
    } catch (RuntimeException $exception) {
        $onlinePaymentsEnabled = false;
        $onlinePaymentsReason = 'configuration';
        $onlinePaymentsMessage = $exception->getMessage();
        error_log('Pagamentos online desabilitados: ' . $exception->getMessage());
    }

    $pdo = database();
    $paymentColumns = $pdo->query(
        "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
           AND COLUMN_NAME IN ('payment_method', 'payment_status', 'syncpay_transaction_id', 'syncpay_pix_code')"
    )->fetchAll(PDO::FETCH_KEY_PAIR);
    $paymentSchemaReady = isset(
        $paymentColumns['payment_method'],
        $paymentColumns['payment_status'],
        $paymentColumns['syncpay_transaction_id'],
        $paymentColumns['syncpay_pix_code']
    ) && str_contains($paymentColumns['payment_method'], "'pix_online'")
        && str_contains($paymentColumns['payment_method'], "'credit_card_online'");
    $eventTableReady = (bool) $pdo->query(
        "SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'syncpay_webhook_events'"
    )->fetchColumn();
    $paymentSchemaReady = $paymentSchemaReady && $eventTableReady;
    if (!$paymentSchemaReady) {
        $onlinePaymentsEnabled = false;
        $onlinePaymentsReason = $onlinePaymentsReason === 'configuration'
            ? 'configuration_and_database'
            : 'database';
        $databaseMessage = 'Aplique database/online-payments-migration.sql com um usuário MySQL administrativo.';
        $onlinePaymentsMessage = $onlinePaymentsMessage !== null
            ? $onlinePaymentsMessage . ' ' . $databaseMessage
            : $databaseMessage;
        error_log('Pagamentos online desabilitados: aplique database/online-payments-migration.sql.');
    }

    $store = $pdo->query(
        'SELECT name, whatsapp_phone, delivery_fee, free_delivery_minimum, estimated_delivery_minutes, is_open
         FROM store_config WHERE id = 1'
    )->fetch();

    if (!$store) {
        respond(['error' => 'Configure as informações da loja no banco de dados.'], 503);
    }

    $products = $pdo->query(
        'SELECT id, name, description, category, price, image_url, is_featured AS featured
         FROM products WHERE is_available = 1 ORDER BY category, sort_order, name'
    )->fetchAll();

    $categories = array_values(array_unique(array_column($products, 'category')));
    foreach ($products as &$product) {
        $product['id'] = (int) $product['id'];
        $product['price'] = (float) $product['price'];
        $product['featured'] = (bool) $product['featured'];
    }
    unset($product);

    $store['delivery_fee'] = (float) $store['delivery_fee'];
    $store['free_delivery_minimum'] = $store['free_delivery_minimum'] === null
        ? 0
        : (float) $store['free_delivery_minimum'];
    $store['estimated_delivery_minutes'] = (int) $store['estimated_delivery_minutes'];
    $store['is_open'] = (bool) $store['is_open'];

    respond([
        'store' => $store,
        'categories' => $categories,
        'products' => $products,
        'online_payments_enabled' => $onlinePaymentsEnabled,
        'online_payments_message' => $onlinePaymentsMessage,
        'credit_card_online_enabled' => false,
        'online_payments_reason' => $onlinePaymentsReason,
        'credit_card_online_reason' => 'temporarily_disabled'
    ]);
} catch (PDOException $exception) {
    error_log('Falha ao carregar cardápio: ' . $exception->getMessage());
    respond(['error' => 'Não foi possível carregar o cardápio agora. Tente novamente em instantes.'], 503);
}
