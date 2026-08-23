<?php
/**
 * Admin REST: customer reviews.
 *
 * @package HappyBites
 */

namespace HappyBites\Api\Admin;

use HappyBites\Data\ReviewsTable;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class ReviewsAdminEndpoint
{
    public function register(): void
    {
        register_rest_route('happybites/v1', '/admin/reviews', [
            'methods' => 'GET',
            'callback' => [$this, 'list'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/reviews/mark-all-read', [
            'methods' => 'POST',
            'callback' => [$this, 'mark_all_read'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/reviews/(?P<id>\d+)', [
            'methods' => 'PATCH',
            'callback' => [$this, 'mark_read'],
            'permission_callback' => [Permission::class, 'check'],
        ]);

        register_rest_route('happybites/v1', '/admin/reviews/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete'],
            'permission_callback' => [Permission::class, 'check'],
        ]);
    }

    public function list(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $table = ReviewsTable::table_name();
        $per_page = max(1, min(50, (int) $request->get_param('per_page') ?: 10));
        $page = max(1, (int) $request->get_param('page') ?: 1);
        $offset = ($page - 1) * $per_page;
        $search = trim(sanitize_text_field($request->get_param('search') ?? ''));
        $status = sanitize_key((string) ($request->get_param('status') ?? 'all'));

        $where = '1=1';
        $params = [];

        if ($status === 'read') {
            $where .= ' AND is_read = 1';
        } elseif ($status === 'unread') {
            $where .= ' AND is_read = 0';
        }

        if ($search !== '') {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= ' AND (customer_name LIKE %s OR customer_email LIKE %s OR comment LIKE %s OR language LIKE %s)';
            $params = array_merge($params, [$like, $like, $like, $like]);
        }

        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where}";
        $total = $params
            ? (int) $wpdb->get_var($wpdb->prepare($count_sql, $params))
            : (int) $wpdb->get_var($count_sql);

        $list_sql = "SELECT * FROM {$table} WHERE {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $list_params = array_merge($params, [$per_page, $offset]);
        $reviews = $wpdb->get_results($wpdb->prepare($list_sql, $list_params), ARRAY_A);

        $stats = $wpdb->get_row(
            "SELECT COUNT(*) AS total, SUM(is_read = 1) AS read_count,
                    AVG(service) AS avg_service, AVG(taste) AS avg_taste, AVG(cleanliness) AS avg_cleanliness
             FROM {$table}",
            ARRAY_A
        );

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'reviews' => $reviews ?: [],
                'pagination' => [
                    'page' => $page,
                    'per_page' => $per_page,
                    'total' => $total,
                    'total_pages' => (int) ceil($total / $per_page),
                ],
                'stats' => [
                    'total' => (int) ($stats['total'] ?? 0),
                    'read' => (int) ($stats['read_count'] ?? 0),
                    'unread' => (int) ($stats['total'] ?? 0) - (int) ($stats['read_count'] ?? 0),
                    'avg_service' => round((float) ($stats['avg_service'] ?? 0), 1),
                    'avg_taste' => round((float) ($stats['avg_taste'] ?? 0), 1),
                    'avg_cleanliness' => round((float) ($stats['avg_cleanliness'] ?? 0), 1),
                ],
            ],
        ], 200);
    }

    public function mark_read(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $review_id = (int) $request->get_param('id');
        $table = ReviewsTable::table_name();

        $updated = $wpdb->update(
            $table,
            ['is_read' => 1],
            ['id' => $review_id],
            ['%d'],
            ['%d']
        );

        if ($updated === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to update review.', 'happybites'),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
        ], 200);
    }

    public function mark_all_read(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $table = ReviewsTable::table_name();
        $updated = $wpdb->query("UPDATE {$table} SET is_read = 1 WHERE is_read = 0");

        if ($updated === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to update reviews.', 'happybites'),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'updated' => (int) $updated,
            ],
        ], 200);
    }

    public function delete(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $review_id = (int) $request->get_param('id');
        $table = ReviewsTable::table_name();

        $deleted = $wpdb->delete($table, ['id' => $review_id], ['%d']);

        if (!$deleted) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to delete review.', 'happybites'),
            ], 400);
        }

        return new WP_REST_Response([
            'success' => true,
        ], 200);
    }
}
