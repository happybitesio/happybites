<?php
/**
 * JSON-RPC MCP protocol handler.
 *
 * @package HappyBites
 */

namespace HappyBites\Mcp;

if (!defined('ABSPATH')) {
    exit;
}

final class McpProtocolHandler
{
    private const PROTOCOL_VERSION = '2024-11-05';

    private McpToolsRegistry $tools;

    public function __construct(McpToolsRegistry $tools)
    {
        $this->tools = $tools;
    }

    /**
     * @param array<string, mixed> $message
     * @return array{body: array<string, mixed>|null, status: int}
     */
    public function handle(array $message): array
    {
        $method = (string) ($message['method'] ?? '');
        $id = $message['id'] ?? null;
        $params = is_array($message['params'] ?? null) ? $message['params'] : [];

        if ($method === '' || strpos($method, 'notifications/') === 0) {
            return ['body' => null, 'status' => 202];
        }

        if ($id === null) {
            return ['body' => null, 'status' => 202];
        }

        try {
            $result = $this->dispatch($method, $params);

            return [
                'body' => [
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'result' => $result,
                ],
                'status' => 200,
            ];
        } catch (\Throwable $exception) {
            return [
                'body' => [
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'error' => [
                        'code' => -32000,
                        'message' => $exception->getMessage(),
                    ],
                ],
                'status' => 200,
            ];
        }
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function dispatch(string $method, array $params): array
    {
        switch ($method) {
            case 'initialize':
                return [
                    'protocolVersion' => self::PROTOCOL_VERSION,
                    'capabilities' => [
                        'tools' => new \stdClass(),
                    ],
                    'serverInfo' => [
                        'name' => 'happybites',
                        'version' => HAPPYBITES_VERSION,
                    ],
                ];
            case 'ping':
                return [];
            case 'tools/list':
                return ['tools' => $this->tools->list_tools()];
            case 'tools/call':
                $name = (string) ($params['name'] ?? '');
                $arguments = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];

                if ($name === '') {
                    throw new \InvalidArgumentException('Tool name is required.');
                }

                try {
                    $payload = $this->tools->call($name, $arguments);

                    return [
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => wp_json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                            ],
                        ],
                        'isError' => false,
                    ];
                } catch (\Throwable $exception) {
                    return [
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $exception->getMessage(),
                            ],
                        ],
                        'isError' => true,
                    ];
                }
            default:
                throw new \InvalidArgumentException(sprintf('Unsupported method: %s', $method));
        }
    }
}
