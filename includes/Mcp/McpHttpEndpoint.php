<?php
/**
 * Hosted MCP HTTP endpoint (Streamable HTTP compatible).
 *
 * @package HappyBites
 */

namespace HappyBites\Mcp;

use HappyBites\Api\Admin\McpAuth;
use HappyBites\Data\McpSettings;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) {
    exit;
}

final class McpHttpEndpoint
{
    private McpProtocolHandler $protocol;

    public function __construct()
    {
        $this->protocol = new McpProtocolHandler(new McpToolsRegistry());
    }

    public function register(): void
    {
        register_rest_route('happybites/v1', '/mcp', [
            'methods' => ['POST', 'GET', 'OPTIONS'],
            'callback' => [$this, 'handle'],
            'permission_callback' => [$this, 'authorize'],
        ]);
    }

  /**
   * @param mixed $request
   */
    public function authorize($request = null): bool
    {
        if (!McpSettings::get()['enabled']) {
            return false;
        }

        return current_user_can('manage_options') || McpAuth::validate_request();
    }

    public function handle(WP_REST_Request $request): WP_REST_Response
    {
        $this->send_cors_headers();

        if ($request->get_method() === 'OPTIONS') {
            return new WP_REST_Response(null, 204);
        }

        if ($request->get_method() === 'GET') {
            return new WP_REST_Response([
                'jsonrpc' => '2.0',
                'error' => [
                    'code' => -32000,
                    'message' => 'Use POST for MCP requests.',
                ],
            ], 405, [
                'Allow' => 'POST, OPTIONS',
            ]);
        }

        $payload = $request->get_json_params();

        if (!is_array($payload)) {
            return $this->rpc_error(null, -32700, 'Invalid JSON payload.', 400);
        }

        $session_id = $this->resolve_session_id($request, $payload);
        $handled = $this->protocol->handle($payload);

        if ($handled['body'] === null) {
            return new WP_REST_Response(null, $handled['status'], $this->response_headers($session_id));
        }

        return new WP_REST_Response($handled['body'], $handled['status'], $this->response_headers($session_id));
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function resolve_session_id(WP_REST_Request $request, array $payload): string
    {
        $existing = trim((string) $request->get_header('mcp-session-id'));

        if ($existing !== '') {
            return $existing;
        }

        if (($payload['method'] ?? '') === 'initialize') {
            return $this->generate_session_id();
        }

        return $this->generate_session_id();
    }

    private function generate_session_id(): string
    {
        if (function_exists('wp_generate_uuid4')) {
            return wp_generate_uuid4();
        }

        return bin2hex(random_bytes(16));
    }

    /**
     * @return array<string, string>
     */
    private function response_headers(string $session_id): array
    {
        return [
            'Mcp-Session-Id' => $session_id,
            'Cache-Control' => 'no-store',
        ];
    }

    private function send_cors_headers(): void
    {
        if (headers_sent()) {
            return;
        }

        $origin = $this->resolve_cors_origin();

        if ($origin !== '') {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, mcp-protocol-version');
        header('Access-Control-Expose-Headers: Mcp-Session-Id');
    }

    private function resolve_cors_origin(): string
    {
        $request_origin = isset($_SERVER['HTTP_ORIGIN'])
            ? sanitize_text_field(wp_unslash($_SERVER['HTTP_ORIGIN']))
            : '';

        $allowed = apply_filters('happybites_mcp_allowed_origins', $this->default_allowed_origins());
        $allowed = array_values(array_unique(array_filter($allowed)));

        if ($request_origin !== '' && in_array($request_origin, $allowed, true)) {
            return $request_origin;
        }

        if ($request_origin === '' && !empty($allowed)) {
            return $allowed[0];
        }

        return '';
    }

    /**
     * @return array<int, string>
     */
    private function default_allowed_origins(): array
    {
        $origins = [];

        foreach ([home_url('/'), site_url('/')] as $url) {
            $origin = $this->site_origin($url);

            if ($origin !== '') {
                $origins[] = $origin;
            }
        }

        return $origins;
    }

    private function site_origin(string $url): string
    {
        $parts = wp_parse_url($url);

        if (empty($parts['scheme']) || empty($parts['host'])) {
            return '';
        }

        $port = isset($parts['port']) ? ':' . (int) $parts['port'] : '';

        return $parts['scheme'] . '://' . $parts['host'] . $port;
    }

    /**
     * @return WP_REST_Response<null>
     */
    private function rpc_error($id, int $code, string $message, int $status): WP_REST_Response
    {
        return new WP_REST_Response([
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ], $status);
    }
}
