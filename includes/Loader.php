<?php
/**
 * WordPress hook loader.
 *
 * @package HappyBites
 */

namespace HappyBites;

if (!defined('ABSPATH')) {
    exit;
}

final class Loader
{
    /** @var array<int, array<string, mixed>> */
    private $actions = [];

    /** @var array<int, array<string, mixed>> */
    private $filters = [];

    /** @var array<int, array<string, mixed>> */
    private $shortcodes = [];

    public function add_action(string $hook, object $component, string $callback, int $priority = 10, int $accepted_args = 1): void
    {
        $this->actions[] = compact('hook', 'component', 'callback', 'priority', 'accepted_args');
    }

    public function add_filter(string $hook, object $component, string $callback, int $priority = 10, int $accepted_args = 1): void
    {
        $this->filters[] = compact('hook', 'component', 'callback', 'priority', 'accepted_args');
    }

    public function add_shortcode(string $tag, object $component, string $callback): void
    {
        $this->shortcodes[] = [
            'tag' => $tag,
            'component' => $component,
            'callback' => $callback,
        ];
    }

    public function run(): void
    {
        foreach ($this->filters as $hook) {
            add_filter(
                $hook['hook'],
                [$hook['component'], $hook['callback']],
                $hook['priority'],
                $hook['accepted_args']
            );
        }

        foreach ($this->actions as $hook) {
            add_action(
                $hook['hook'],
                [$hook['component'], $hook['callback']],
                $hook['priority'],
                $hook['accepted_args']
            );
        }

        foreach ($this->shortcodes as $shortcode) {
            add_shortcode($shortcode['tag'], [$shortcode['component'], $shortcode['callback']]);
        }

        $this->filters = [];
        $this->actions = [];
        $this->shortcodes = [];
    }
}
