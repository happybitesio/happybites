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

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- custom reviews table.

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
        $is_read = null;
        if ($status === 'read') {
            $is_read = 1;
        } elseif ($status === 'unread') {
            $is_read = 0;
        }

        // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is prefix + hardcoded identifier.
        if ($search !== '') {
            $like = '%' . $wpdb->esc_like($search) . '%';
            if ($is_read === null) {
                $total = (int) $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT COUNT(*) FROM {$table} WHERE (customer_name LIKE %s OR customer_email LIKE %s OR comment LIKE %s OR language LIKE %s)",
                        $like,
                        $like,
                        $like,
                        $like
                    )
                );
                $reviews = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT * FROM {$table} WHERE (customer_name LIKE %s OR customer_email LIKE %s OR comment LIKE %s OR language LIKE %s) ORDER BY created_at DESC LIMIT %d OFFSET %d",
                        $like,
                        $like,
                        $like,
                        $like,
                        $per_page,
                        $offset
                    ),
                    ARRAY_A
                );
            } else {
                $total = (int) $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT COUNT(*) FROM {$table} WHERE is_read = %d AND (customer_name LIKE %s OR customer_email LIKE %s OR comment LIKE %s OR language LIKE %s)",
                        $is_read,
                        $like,
                        $like,
                        $like,
                        $like
                    )
                );
                $reviews = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT * FROM {$table} WHERE is_read = %d AND (customer_name LIKE %s OR customer_email LIKE %s OR comment LIKE %s OR language LIKE %s) ORDER BY created_at DESC LIMIT %d OFFSET %d",
                        $is_read,
                        $like,
                        $like,
                        $like,
                        $like,
                        $per_page,
                        $offset
                    ),
                    ARRAY_A
                );
            }
        } elseif ($is_read === null) {
            $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
            $reviews = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d OFFSET %d",
                    $per_page,
                    $offset
                ),
                ARRAY_A
            );
        } else {
            $total = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE is_read = %d",
                    $is_read
                )
            );
            $reviews = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM {$table} WHERE is_read = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
                    $is_read,
                    $per_page,
                    $offset
                ),
                ARRAY_A
            );
        }

        $stats = $wpdb->get_row(
            "SELECT COUNT(*) AS total, SUM(is_read = 1) AS read_count,
                    AVG(service) AS avg_service, AVG(taste) AS avg_taste, AVG(cleanliness) AS avg_cleanliness
             FROM {$table}",
            ARRAY_A
        );
        // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

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
        $updated = $wpdb->update(
            $table,
            ['is_read' => 1],
            ['is_read' => 0],
            ['%d'],
            ['%d']
        );

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
