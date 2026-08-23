<?php
/**
 * MCP tool definitions and execution via internal REST dispatch.
 *
 * @package HappyBites
 */

namespace HappyBites\Mcp;

use WP_REST_Request;

if (!defined('ABSPATH')) {
    exit;
}

final class McpToolsRegistry
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function list_tools(): array
    {
        return [
            $this->tool('get_public_menu', 'Fetch the public menu tree as guests see it.'),
            $this->tool('get_menu_sitemap', 'Fetch a machine-readable index of menu URLs, categories, and products for agents.'),
            $this->tool('get_settings', 'Get all HappyBites plugin settings.'),
            $this->tool('update_settings', 'Update HappyBites settings.', [
                'settings' => ['type' => 'object'],
            ], ['settings']),
            $this->tool('get_menu_tree', 'Get admin menu tree with categories and products.'),
            $this->tool('save_menu_order', 'Save menu category/product order.', [
                'categories' => ['type' => 'array'],
                'uncategorizedProducts' => ['type' => 'array'],
            ]),
            $this->tool('create_category', 'Create a menu category.', [
                'name' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'parent_id' => ['type' => 'integer'],
            ], ['name']),
            $this->tool('update_category', 'Update a menu category.', [
                'id' => ['type' => 'integer'],
                'name' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'parent_id' => ['type' => 'integer'],
            ], ['id']),
            $this->tool('delete_category', 'Delete a menu category.', [
                'id' => ['type' => 'integer'],
            ], ['id']),
            $this->tool('get_product', 'Get a single product with all fields including status and public_url.', [
                'id' => ['type' => 'integer'],
            ], ['id']),
            $this->tool('create_product', 'Create a product in a category.', [
                'category_id' => ['type' => 'integer'],
                'status' => ['type' => 'string', 'description' => 'publish or draft. Defaults to publish.'],
                'title' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'price' => ['type' => 'number'],
                'image_id' => ['type' => 'integer'],
                'image_url' => ['type' => 'string'],
                'alt_text' => ['type' => 'string'],
                'tags' => ['type' => 'array'],
                'languages' => ['type' => 'object'],
                'weight' => ['type' => 'string'],
                'origin_country' => ['type' => 'string'],
                'spice_level' => ['type' => 'string'],
                'preparation_time' => ['type' => 'string'],
                'portion_size' => ['type' => 'string'],
                'nutrition' => ['type' => 'array'],
                'additives' => ['type' => 'array'],
            ], ['category_id', 'title']),
            $this->tool('update_product', 'Update a product.', [
                'id' => ['type' => 'integer'],
                'status' => ['type' => 'string', 'description' => 'publish or draft.'],
                'category_id' => ['type' => 'integer'],
                'title' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'price' => ['type' => 'number'],
                'image_id' => ['type' => 'integer'],
                'image_url' => ['type' => 'string'],
                'alt_text' => ['type' => 'string'],
                'tags' => ['type' => 'array'],
                'languages' => ['type' => 'object'],
                'weight' => ['type' => 'string'],
                'origin_country' => ['type' => 'string'],
                'spice_level' => ['type' => 'string'],
                'preparation_time' => ['type' => 'string'],
                'portion_size' => ['type' => 'string'],
                'nutrition' => ['type' => 'array'],
                'additives' => ['type' => 'array'],
            ], ['id']),
            $this->tool('set_product_status', 'Set product visibility. Use draft to hide from the public menu, publish to show it.', [
                'id' => ['type' => 'integer'],
                'status' => ['type' => 'string', 'description' => 'publish or draft'],
            ], ['id', 'status']),
            $this->tool('set_product_image', 'Set or replace a product image from URL or media library ID.', [
                'id' => ['type' => 'integer'],
                'image_url' => ['type' => 'string'],
                'image_id' => ['type' => 'integer'],
                'alt_text' => ['type' => 'string'],
            ], ['id']),
            $this->tool('delete_product', 'Delete a product.', [
                'id' => ['type' => 'integer'],
            ], ['id']),
            $this->tool('list_reviews', 'List guest reviews.', [
                'page' => ['type' => 'integer'],
                'search' => ['type' => 'string'],
            ]),
            $this->tool('mark_review_read', 'Mark a review as read.', [
                'id' => ['type' => 'integer'],
            ], ['id']),
            $this->tool('delete_review', 'Delete a review.', [
                'id' => ['type' => 'integer'],
            ], ['id']),
        ];
    }

    /**
     * @param array<string, mixed> $arguments
     * @return array<string, mixed>
     */
    public function call(string $name, array $arguments): array
    {
        switch ($name) {
            case 'get_public_menu':
                return $this->dispatch('GET', '/menu');
            case 'get_menu_sitemap':
                return $this->dispatch('GET', '/menu/sitemap');
            case 'get_settings':
                return $this->dispatch('GET', '/admin/settings');
            case 'update_settings':
                return $this->dispatch('PUT', '/admin/settings', $arguments['settings'] ?? []);
            case 'get_menu_tree':
                return $this->dispatch('GET', '/admin/menu');
            case 'save_menu_order':
                return $this->dispatch('PUT', '/admin/menu/order', $arguments);
            case 'create_category':
                return $this->dispatch('POST', '/admin/categories', $arguments);
            case 'update_category':
                $id = (int) ($arguments['id'] ?? 0);
                unset($arguments['id']);
                return $this->dispatch('PUT', '/admin/categories/' . $id, $arguments);
            case 'delete_category':
                return $this->dispatch('DELETE', '/admin/categories/' . (int) ($arguments['id'] ?? 0));
            case 'get_product':
                return $this->dispatch('GET', '/admin/products/' . (int) ($arguments['id'] ?? 0));
            case 'create_product':
                return $this->dispatch('POST', '/admin/products', $this->normalize_product_payload($arguments));
            case 'update_product':
                $id = (int) ($arguments['id'] ?? 0);
                unset($arguments['id']);
                return $this->dispatch('PUT', '/admin/products/' . $id, $this->normalize_product_payload($arguments));
            case 'set_product_status':
                $id = (int) ($arguments['id'] ?? 0);
                return $this->dispatch('PATCH', '/admin/products/' . $id . '/status', [
                    'status' => (string) ($arguments['status'] ?? ''),
                ]);
            case 'set_product_image':
                $id = (int) ($arguments['id'] ?? 0);
                unset($arguments['id']);
                return $this->dispatch('PUT', '/admin/products/' . $id . '/image', $arguments);
            case 'delete_product':
                return $this->dispatch('DELETE', '/admin/products/' . (int) ($arguments['id'] ?? 0));
            case 'list_reviews':
                return $this->dispatch('GET', '/admin/reviews', null, $arguments);
            case 'mark_review_read':
                return $this->dispatch('PATCH', '/admin/reviews/' . (int) ($arguments['id'] ?? 0), ['is_read' => true]);
            case 'delete_review':
                return $this->dispatch('DELETE', '/admin/reviews/' . (int) ($arguments['id'] ?? 0));
            default:
                throw new \InvalidArgumentException(sprintf('Unknown tool: %s', $name));
        }
    }

    /**
     * @param array<string, mixed> $arguments
     * @return array<string, mixed>
     */
    private function normalize_product_payload(array $arguments): array
    {
        if (!empty($arguments['image_url']) || !empty($arguments['alt_text']) || array_key_exists('image_id', $arguments)) {
            $arguments['image_touched'] = true;
        }

        return $arguments;
    }

    /**
     * @param array<string, mixed>|null $body
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    private function dispatch(string $method, string $path, ?array $body = null, array $query = []): array
    {
        $request = new WP_REST_Request($method, '/happybites/v1' . $path);

        foreach ($query as $key => $value) {
            if ($value !== null && $value !== '') {
                $request->set_param($key, $value);
            }
        }

        if ($body !== null) {
            $request->set_header('Content-Type', 'application/json');
            $request->set_body(wp_json_encode($body));
        }

        $response = rest_do_request($request);

        if ($response->is_error()) {
            $error = $response->as_error();
            throw new \RuntimeException($error->get_error_message());
        }

        $data = $response->get_data();

        if (is_array($data) && array_key_exists('success', $data) && $data['success'] === false) {
            throw new \RuntimeException((string) ($data['message'] ?? 'Request failed.'));
        }

        if (is_array($data) && array_key_exists('data', $data)) {
            return is_array($data['data']) ? $data['data'] : ['result' => $data['data']];
        }

        return is_array($data) ? $data : ['result' => $data];
    }

    /**
     * @param array<string, mixed> $properties
     * @param array<int, string> $required
     * @return array<string, mixed>
     */
    private function tool(string $name, string $description, array $properties = [], array $required = []): array
    {
        $schema = [
            'type' => 'object',
            'properties' => empty($properties) ? new \stdClass() : $properties,
        ];

        if ($required !== []) {
            $schema['required'] = $required;
        }

        return [
            'name' => $name,
            'description' => $description,
            'inputSchema' => $schema,
        ];
    }
}
