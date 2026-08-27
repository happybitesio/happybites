<?php
/**
 * Built-in frontend theme presets (light + dark palettes).
 *
 * @package HappyBites
 */

namespace HappyBites\Data;

if (!defined('ABSPATH')) {
    exit;
}

final class ThemePresets
{
    public const PALETTE_KEYS = [
        'background',
        'surface',
        'text',
        'text_muted',
        'primary',
        'accent',
        'border',
        'header',
    ];

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            'verdant_brew' => self::preset(
                __('Verdant Brew', 'happybites'),
                __('Deep forest green with warm cream accents.', 'happybites'),
                '#00704a',
                '#d4e9e2',
                [
                    'background' => '#f4f9f7',
                    'surface' => '#ffffff',
                    'text' => '#1a2e24',
                    'text_muted' => '#5c7268',
                    'primary' => '#00704a',
                    'accent' => '#1e3932',
                    'border' => '#d4e9e2',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#0a1410',
                    'surface' => '#14241c',
                    'text' => '#ecfdf5',
                    'text_muted' => '#9cb8ad',
                    'primary' => '#00a862',
                    'accent' => '#6ee7b7',
                    'border' => '#1f3529',
                    'header' => '#14241c',
                ]
            ),
            'golden_flame' => self::preset(
                __('Golden Flame', 'happybites'),
                __('Bold red paired with sunny golden yellow.', 'happybites'),
                '#da291c',
                '#ffc72c',
                [
                    'background' => '#fffbf3',
                    'surface' => '#ffffff',
                    'text' => '#2b120f',
                    'text_muted' => '#7a5c52',
                    'primary' => '#da291c',
                    'accent' => '#ffc72c',
                    'border' => '#f5e6c8',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#140908',
                    'surface' => '#221412',
                    'text' => '#fff8f0',
                    'text_muted' => '#c4a89a',
                    'primary' => '#ff4d3d',
                    'accent' => '#ffd24d',
                    'border' => '#3a221c',
                    'header' => '#221412',
                ]
            ),
            'blue_slice' => self::preset(
                __('Blue Slice', 'happybites'),
                __('Delivery blue with a sharp tomato red accent.', 'happybites'),
                '#006491',
                '#e31837',
                [
                    'background' => '#f3f8fb',
                    'surface' => '#ffffff',
                    'text' => '#0f2433',
                    'text_muted' => '#5f7a8c',
                    'primary' => '#006491',
                    'accent' => '#e31837',
                    'border' => '#d6e6ef',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#07131c',
                    'surface' => '#0f2230',
                    'text' => '#eff6fb',
                    'text_muted' => '#8fafc4',
                    'primary' => '#2aa3d4',
                    'accent' => '#ff5a73',
                    'border' => '#1a3344',
                    'header' => '#0f2230',
                ]
            ),
            'southern_spice' => self::preset(
                __('Southern Spice', 'happybites'),
                __('Fiery chicken-red with crisp black contrast.', 'happybites'),
                '#e4002b',
                '#262626',
                [
                    'background' => '#fff8f8',
                    'surface' => '#ffffff',
                    'text' => '#1f1013',
                    'text_muted' => '#7a5a60',
                    'primary' => '#e4002b',
                    'accent' => '#262626',
                    'border' => '#f3d9dc',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#120608',
                    'surface' => '#1f0c10',
                    'text' => '#fff1f2',
                    'text_muted' => '#c49aa0',
                    'primary' => '#ff3d5c',
                    'accent' => '#f5f5f5',
                    'border' => '#3a141c',
                    'header' => '#1f0c10',
                ]
            ),
            'milano_roast' => self::preset(
                __('Milano Roast', 'happybites'),
                __('Italian espresso red with polished silver tones.', 'happybites'),
                '#c8102e',
                '#8b8d8f',
                [
                    'background' => '#fdf8f8',
                    'surface' => '#ffffff',
                    'text' => '#241014',
                    'text_muted' => '#7a6468',
                    'primary' => '#c8102e',
                    'accent' => '#8b8d8f',
                    'border' => '#efe2e4',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#10080a',
                    'surface' => '#1c1014',
                    'text' => '#fff1f2',
                    'text_muted' => '#b8a0a4',
                    'primary' => '#ef4a63',
                    'accent' => '#d1d5db',
                    'border' => '#301820',
                    'header' => '#1c1014',
                ]
            ),
            'turin_classic' => self::preset(
                __('Turin Classic', 'happybites'),
                __('Royal navy blue with heritage gold highlights.', 'happybites'),
                '#1a2859',
                '#c5a900',
                [
                    'background' => '#f6f7fb',
                    'surface' => '#ffffff',
                    'text' => '#121a33',
                    'text_muted' => '#5f6680',
                    'primary' => '#1a2859',
                    'accent' => '#c5a900',
                    'border' => '#dde2f0',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#080c18',
                    'surface' => '#11182c',
                    'text' => '#eef2ff',
                    'text_muted' => '#9aa3c2',
                    'primary' => '#4f6fd8',
                    'accent' => '#e4c84a',
                    'border' => '#1c2540',
                    'header' => '#11182c',
                ]
            ),
            'velvet_bean' => self::preset(
                __('Velvet Bean', 'happybites'),
                __('Rich burgundy with soft roasted gold.', 'happybites'),
                '#861f41',
                '#c5a059',
                [
                    'background' => '#faf6f7',
                    'surface' => '#ffffff',
                    'text' => '#2a1018',
                    'text_muted' => '#7a5a64',
                    'primary' => '#861f41',
                    'accent' => '#c5a059',
                    'border' => '#ecdfe4',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#12080c',
                    'surface' => '#1f1016',
                    'text' => '#fdf2f4',
                    'text_muted' => '#c4a0aa',
                    'primary' => '#c4476d',
                    'accent' => '#e4c078',
                    'border' => '#341c24',
                    'header' => '#1f1016',
                ]
            ),
            'glazed_ring' => self::preset(
                __('Glazed Ring', 'happybites'),
                __('Playful orange glaze with raspberry pink.', 'happybites'),
                '#ff671f',
                '#da1884',
                [
                    'background' => '#fff9f5',
                    'surface' => '#ffffff',
                    'text' => '#2a1408',
                    'text_muted' => '#8a6a58',
                    'primary' => '#ff671f',
                    'accent' => '#da1884',
                    'border' => '#f8e4d8',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#160c06',
                    'surface' => '#24140c',
                    'text' => '#fff7f0',
                    'text_muted' => '#c4a090',
                    'primary' => '#ff8a4d',
                    'accent' => '#f472b6',
                    'border' => '#3a2214',
                    'header' => '#24140c',
                ]
            ),
            'maple_roast' => self::preset(
                __('Maple Roast', 'happybites'),
                __('Canadian red with roasted coffee brown.', 'happybites'),
                '#c8102e',
                '#4b2e21',
                [
                    'background' => '#faf7f5',
                    'surface' => '#ffffff',
                    'text' => '#241410',
                    'text_muted' => '#7a6458',
                    'primary' => '#c8102e',
                    'accent' => '#4b2e21',
                    'border' => '#eadfd8',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#100a08',
                    'surface' => '#1c1410',
                    'text' => '#faf5f0',
                    'text_muted' => '#c4a898',
                    'primary' => '#ef4a63',
                    'accent' => '#a67c5c',
                    'border' => '#302218',
                    'header' => '#1c1410',
                ]
            ),
            'prestige_green' => self::preset(
                __('Prestige Green', 'happybites'),
                __('Luxury emerald with champagne gold.', 'happybites'),
                '#006039',
                '#a37e2c',
                [
                    'background' => '#f5faf7',
                    'surface' => '#ffffff',
                    'text' => '#0f2418',
                    'text_muted' => '#5c7264',
                    'primary' => '#006039',
                    'accent' => '#a37e2c',
                    'border' => '#d8ebe0',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#08120c',
                    'surface' => '#102018',
                    'text' => '#ecfdf3',
                    'text_muted' => '#9cb8a8',
                    'primary' => '#00a862',
                    'accent' => '#d4b06a',
                    'border' => '#1c3024',
                    'header' => '#102018',
                ]
            ),
            'golden_bean' => self::preset(
                __('Golden Bean', 'happybites'),
                __('Warm café brown with bright golden highlights.', 'happybites'),
                '#86604a',
                '#ffc72c',
                [
                    'background' => '#faf7f3',
                    'surface' => '#ffffff',
                    'text' => '#2a1c14',
                    'text_muted' => '#7a6658',
                    'primary' => '#86604a',
                    'accent' => '#ffc72c',
                    'border' => '#ebe2d8',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#120e0a',
                    'surface' => '#201810',
                    'text' => '#faf6f0',
                    'text_muted' => '#c4b0a0',
                    'primary' => '#b8886a',
                    'accent' => '#ffd24d',
                    'border' => '#342818',
                    'header' => '#201810',
                ]
            ),
            'corner_cafe' => self::preset(
                __('Corner Café', 'happybites'),
                __('Neighborhood coffee browns and warm beige.', 'happybites'),
                '#5c3d2e',
                '#c8916e',
                [
                    'background' => '#faf6f2',
                    'surface' => '#ffffff',
                    'text' => '#2a1c14',
                    'text_muted' => '#7a6658',
                    'primary' => '#5c3d2e',
                    'accent' => '#c8916e',
                    'border' => '#e8ddd4',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#100c08',
                    'surface' => '#1c1610',
                    'text' => '#faf6f0',
                    'text_muted' => '#c4b0a0',
                    'primary' => '#a67c5c',
                    'accent' => '#e4b898',
                    'border' => '#302418',
                    'header' => '#1c1610',
                ]
            ),
            'custom' => self::preset(
                __('Custom', 'happybites'),
                __('Fully customize every color.', 'happybites'),
                '#00704a',
                '#d4e9e2',
                [
                    'background' => '#f4f9f7',
                    'surface' => '#ffffff',
                    'text' => '#1a2e24',
                    'text_muted' => '#5c7268',
                    'primary' => '#00704a',
                    'accent' => '#1e3932',
                    'border' => '#d4e9e2',
                    'header' => '#ffffff',
                ],
                [
                    'background' => '#0a1410',
                    'surface' => '#14241c',
                    'text' => '#ecfdf5',
                    'text_muted' => '#9cb8ad',
                    'primary' => '#00a862',
                    'accent' => '#6ee7b7',
                    'border' => '#1f3529',
                    'header' => '#14241c',
                ]
            ),
        ];
    }

    /**
     * @return array<string, array<string, array<string, string>>>
     */
    public static function palettes_for_admin(): array
    {
        $out = [];

        foreach (self::all() as $id => $preset) {
            $out[$id] = [
                'light' => $preset['light'],
                'dark' => $preset['dark'],
            ];
        }

        return $out;
    }

    /**
     * @return array<int, array<string, string>>
     */
    public static function for_admin(): array
    {
        $out = [];

        foreach (self::all() as $id => $preset) {
            $out[] = [
                'id' => $id,
                'name' => $preset['name'],
                'description' => $preset['description'],
                'swatch' => $preset['swatch'],
                'swatch_accent' => $preset['swatch_accent'],
            ];
        }

        return $out;
    }

    /**
     * @param array<string, string> $light
     * @param array<string, string> $dark
     * @return array<string, mixed>
     */
    private static function preset(
        string $name,
        string $description,
        string $swatch_primary,
        string $swatch_accent,
        array $light,
        array $dark
    ): array {
        return [
            'name' => $name,
            'description' => $description,
            'swatch' => $swatch_primary,
            'swatch_accent' => $swatch_accent,
            'light' => $light,
            'dark' => $dark,
        ];
    }
}
