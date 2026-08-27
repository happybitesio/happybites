<?php
/**
 * Seed sample customer reviews for development and previews.
 *
 * @package HappyBites
 */

namespace HappyBites\Migration;

use HappyBites\Data\ReviewsTable;

if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- custom reviews table seeder.

final class ReviewSeeder
{
    /**
     * @return array{created: int, skipped: bool}
     */
    public static function run(bool $force = false): array
    {
        global $wpdb;

        $table = ReviewsTable::table_name();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- table name is prefix + hardcoded identifier.
        $existing = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");

        if ($existing > 0 && !$force) {
            return ['created' => 0, 'skipped' => true];
        }

        if ($force && $existing > 0) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is prefix + hardcoded identifier.
            $wpdb->query("TRUNCATE TABLE {$table}");
        }

        $samples = self::samples();
        $created = 0;

        foreach ($samples as $index => $sample) {
            $inserted = $wpdb->insert(
                $table,
                [
                    'service' => $sample['service'],
                    'taste' => $sample['taste'],
                    'cleanliness' => $sample['cleanliness'],
                    'comment' => $sample['comment'],
                    'language' => $sample['language'],
                    'customer_name' => $sample['customer_name'],
                    'customer_email' => $sample['customer_email'],
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'HappyBites ReviewSeeder',
                    'created_at' => $sample['created_at'],
                    'is_read' => $sample['is_read'],
                ],
                ['%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d']
            );

            if ($inserted !== false) {
                $created++;
            }
        }

        return ['created' => $created, 'skipped' => false];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function samples(): array
    {
        $now = current_time('timestamp');
        $items = [
            ['Ayşe Yılmaz', 'ayse@example.com', 5, 5, 5, 'Harika bir deneyimdi. Servis çok hızlıydı ve yemekler taptaze geldi.', 'tr', 0],
            ['Mehmet Kaya', '', 4, 5, 4, 'Lezzetler çok başarılı. Sadece yoğun saatte biraz bekledik.', 'tr', 0],
            ['Zeynep Demir', 'zeynep@example.com', 5, 4, 5, 'Mekan çok temiz, personel güler yüzlü. Menüden QR ile sipariş vermek çok pratik.', 'tr', 1],
            ['John Smith', 'john@example.com', 4, 4, 4, 'Great food and friendly staff. Would definitely come again.', 'en', 1],
            ['Elif Arslan', '', 3, 4, 3, 'Yemekler güzeldi fakat servis biraz yavaştı.', 'tr', 0],
            ['Can Öztürk', 'can@example.com', 5, 5, 4, 'Özellikle ana yemekler muhteşemdi. Fiyat performans çok iyi.', 'tr', 1],
            ['Maria Rossi', 'maria@example.com', 5, 5, 5, 'Authentic flavors and excellent presentation. Loved the digital menu.', 'en', 0],
            ['Burak Şahin', '', 4, 3, 4, 'Genel olarak memnun kaldık. Tatlılar biraz daha iyi olabilirdi.', 'tr', 1],
            ['Selin Aydın', 'selin@example.com', 5, 5, 5, 'Ailece geldik, herkes çok memnun kaldı. Çocuklar için de uygun bir ortam.', 'tr', 0],
            ['Thomas Müller', '', 4, 5, 4, 'Sehr gutes Essen und schneller Service.', 'de', 1],
            ['Deniz Koç', 'deniz@example.com', 2, 3, 4, 'Beklentimizin altında kaldı. Ana yemek soğuktu.', 'tr', 0],
            ['Gizem Yıldız', '', 5, 5, 5, 'Kahvaltı tabağı favorim oldu. Kesinlikle tavsiye ederim.', 'tr', 1],
            ['Alex Johnson', 'alex@example.com', 4, 4, 5, 'Clean place, tasty dishes, and easy menu access from the table.', 'en', 0],
            ['Hakan Polat', '', 5, 4, 4, 'Personel ilgiliydi. Menüde vejetaryen seçenekler biraz daha fazla olabilir.', 'tr', 1],
            ['İrem Çelik', 'irem@example.com', 4, 5, 5, 'Hijyen konusunda çok titizler. Yemekler de lezzetliydi.', 'tr', 0],
            ['Sophie Martin', '', 5, 5, 4, 'Très bon repas, service rapide et menu digital très pratique.', 'fr', 1],
            ['Emre Güler', 'emre@example.com', 3, 4, 3, 'Fiyatlar biraz yüksek ama kalite iyi.', 'tr', 0],
            ['Fatma Acar', '', 5, 5, 5, 'Doğum günü kutlaması için geldik, ekstra ilgi gösterdiler. Teşekkürler!', 'tr', 1],
            ['Luca Bianchi', 'luca@example.com', 4, 5, 4, 'Nice atmosphere and delicious pasta.', 'en', 0],
            ['Merve Aksoy', '', 5, 4, 5, 'QR menü çok kullanışlı. Garson beklemeye gerek kalmadı.', 'tr', 1],
            ['Kerem Yavuz', 'kerem@example.com', 4, 4, 4, 'Standartların üzerinde bir deneyim. Tekrar geleceğiz.', 'tr', 0],
            ['Anna Kowalski', '', 5, 5, 5, 'Everything was perfect from start to finish.', 'en', 1],
            ['Oğuz Tan', 'oguz@example.com', 4, 3, 4, 'Mezeler çok iyiydi. Ana yemekte porsiyon biraz küçüktü.', 'tr', 0],
            ['Pınar Erdem', '', 5, 5, 4, 'Kahve ve tatlı kombinasyonu harikaydı.', 'tr', 1],
            ['David Cohen', 'david@example.com', 3, 4, 4, 'Good food overall. Music was a bit loud for conversation.', 'en', 0],
            ['Seda Karaca', '', 5, 5, 5, 'Hem lezzet hem sunum çok başarılı. Personel çok nazikti.', 'tr', 1],
            ['Yusuf Aktaş', 'yusuf@example.com', 4, 5, 4, 'Menü çeşitliliği güzel. Özellikle deniz ürünleri taze.', 'tr', 0],
            ['Laura García', '', 5, 4, 5, 'Muy buena comida y ambiente agradable.', 'es', 1],
        ];

        $samples = [];

        foreach ($items as $index => $item) {
            [$name, $email, $service, $taste, $cleanliness, $comment, $language, $is_read] = $item;
            $days_ago = $index * 2 + ($index % 3);
            $samples[] = [
                'customer_name' => $name,
                'customer_email' => $email,
                'service' => $service,
                'taste' => $taste,
                'cleanliness' => $cleanliness,
                'comment' => $comment,
                'language' => $language,
                'is_read' => $is_read,
                'created_at' => gmdate('Y-m-d H:i:s', $now - ($days_ago * DAY_IN_SECONDS) - ($index * HOUR_IN_SECONDS)),
            ];
        }

        return $samples;
    }
}
