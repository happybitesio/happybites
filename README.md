# HappyBites

**QR food menus that feel like a real app — on WordPress.**

Guests scan a code and your menu opens instantly. No PDF. No extra app to install. You manage everything from WordPress.

[Website](https://happybites.io) · [Get Pro](https://happybites.io)

![WordPress 5.8+](https://img.shields.io/badge/WordPress-5.8+-21759B?logo=wordpress&logoColor=white)
![PHP 7.4+](https://img.shields.io/badge/PHP-7.4+-777BB4?logo=php&logoColor=white)
![License: GPLv2](https://img.shields.io/badge/license-GPLv2-blue)

---

## Built for restaurants

HappyBites turns your WordPress site into a branded digital menu. Share one QR code on the table — guests browse dishes, photos, prices, and languages on their phone.

- **Looks like an app.** The guest menu is a fast PWA, not a long WordPress page.
- **Easy to run.** Add categories, products, and photos from a modern React admin inside WordPress.
- **Your brand.** Theme presets, logo, colors, working hours, Wi‑Fi, and social links.
- **Trust at the table.** Collect reviews, with optional Google reCAPTCHA spam protection.
- **Speaks your guests’ language.** 13 languages, including English, Turkish, German, French, Spanish, Arabic, Japanese, and more.

The guest menu never adds a HappyBites credit unless you turn it on.

## What you can do

| | Free | [Pro](https://happybites.io) |
|---|---|---|
| Unlimited categories & products | ✓ | ✓ |
| QR menu & mobile PWA | ✓ | ✓ |
| Theme presets | ✓ | ✓ |
| Multi-language menu | ✓ | ✓ |
| Guest reviews | ✓ | ✓ |
| Custom design, logo themes, header overlay | | ✓ |
| Instagram-style menu stories | | ✓ |
| Footer bar on the guest menu | | ✓ |
| Analytics (Google Tag Manager) | | ✓ |
| Menu import & export | | ✓ |
| AI agents (MCP) to manage the menu | | ✓ |

## Get started

1. Install **HappyBites** on WordPress 5.8+ (PHP 7.4+).
2. Open **HappyBites** in the admin and add your restaurant, categories, and dishes.
3. Copy the menu URL or QR code from **Settings → General**.
4. Put the code on the table. That’s it.

Need a custom look, stories, analytics, a footer bar, or AI tools? Install [HappyBites Pro](https://happybites.io) and activate your license under **HappyBites → License**.

## For developers

HappyBites is GPL-licensed WordPress software. React source for the admin and guest menu lives in `admin-app/` and `pwa/` (`npm install` then `npm run build` in each folder).

### Source of truth

- **Develop only in this Git repo** (e.g. Laragon `wp-content/plugins/happybites`).
- **WordPress.org SVN is a deploy target**, not a second place to edit code.
- Do not hand-copy files from C: to the SVN working copy.

### Local WordPress.org deploy

```powershell
# Preview (build + stage only, no SVN write)
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-wporg.ps1 -DryRun

# Commit trunk
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-wporg.ps1

# Commit trunk + recreate tags/<version> (Stable tag must match happybites.php)
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-wporg.ps1 -Tag
```
Default SVN root: `D:\PROJECTS\PhpProjects\happybites-svn` (override with `-SvnRoot`).

Banners/screenshots stay in SVN `assets/` beside `trunk/` — update those separately when needed.

### GitHub Release + optional.org deploy

1. Bump version in `happybites.php` and `readme.txt` (`Stable tag`).
2. Push a matching tag (`v2.0.6` or `2.0.6`).
3. `release.yml` builds the zip and creates a GitHub Release.
4. `deploy-wporg.yml` (optional) pushes the same build to plugins.svn.wordpress.org via [10up/action-wordpress-plugin-deploy](https://github.com/10up/action-wordpress-plugin-deploy). Set repo secrets `SVN_USERNAME` and `SVN_PASSWORD`.

Questions or partnership: [happybites.io](https://happybites.io)
