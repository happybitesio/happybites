=== HappyBites – QR Code Food Menu ===
Contributors: happybites
Tags: restaurant, menu, qr code, food menu, digital menu
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.0.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create a modern, mobile-friendly QR food menu for your restaurant, fully integrated with WordPress.

== Description ==

HappyBites helps restaurants publish a beautiful mobile menu that guests open by scanning a QR code.

* React-powered admin for menu, categories, products, settings, and reviews
* Fast PWA guest menu with multi-language support
* Theme presets and brand colors
* WiFi info, social links, working hours, and extra HTML content
* Customer reviews with optional Google reCAPTCHA v3 spam protection

The guest menu does not add credit or promotional links unless you opt in under **HappyBites → Settings → General**.

== HappyBites Pro ==

The free plugin includes the full menu, presets, reviews, and multi-language support. **HappyBites Pro** is a separate add-on (annual subscription) that unlocks:

* Custom design — color editor, logo-based themes, browser theme-color, header overlay
* Instagram-style menu stories
* Footer bar on the guest menu
* Analytics via Google Tag Manager
* Menu import and export
* MCP — AI agent menu management

Purchase: https://happybites.io/checkout

Install HappyBites Pro and enter your license key under **HappyBites → License**.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/happybites`, or install through the WordPress plugins screen.
2. Activate the plugin through the **Plugins** screen.
3. Open **HappyBites** in the WordPress admin and configure your menu.
4. Share the menu URL or QR code with guests.

== Frequently Asked Questions ==

= Where is the guest menu URL? =

Go to **HappyBites → Settings → General**. The menu slug defines the public URL.

= How do I protect reviews from spam? =

Go to **HappyBites → Settings → Security** and add your Google reCAPTCHA v3 Site Key and Secret Key. Review submissions then call Google’s verification API.

= Where is the privacy policy link shown? =

The privacy policy link is shown on the guest review form. Under **Settings → Security** you can set a custom privacy policy URL. If left empty, your site's WordPress privacy policy page (Settings → Privacy) is used; if neither is set, the link is hidden.

= Can AI agents manage my menu? =

MCP is a **HappyBites Pro** feature. Purchase at https://happybites.io/checkout, install the HappyBites Pro add-on, activate your license under **License**, then enable MCP under **Settings → MCP**.

= What is HappyBites Pro? =

Pro is a separate plugin (annual subscription) that adds custom design, menu stories, a guest-menu footer bar, Google Tag Manager analytics, menu import/export, and MCP. Free users keep full menu management and built-in theme presets.

= How do I show a HappyBites credit on the guest menu? =

Go to **HappyBites → Settings → General** and enable **Show a HappyBites credit link on the guest menu**. It is off by default.

== Privacy ==

The review form may collect optional name, email, comment, ratings, IP address, and browser user agent. Configure your privacy policy URL under **Settings → Security**, or use your WordPress privacy policy page.

If Google reCAPTCHA v3 is enabled, review submissions send a token to Google for spam checks. See Google’s privacy policy: https://policies.google.com/privacy

== External services ==

This plugin can connect to **Google reCAPTCHA v3** when you enable it under **HappyBites → Settings → Security**. It is used only to reduce spam on the guest review form.

When a guest submits a review, the plugin sends the reCAPTCHA response token (and the server IP WordPress sees) to Google’s verification API at `https://www.google.com/recaptcha/api/siteverify`. The guest browser also loads `https://www.google.com/recaptcha/api.js` to obtain that token.

No account with HappyBites is required. You must create your own reCAPTCHA v3 keys in Google’s admin console. If the keys are empty, the plugin does not call Google.

Google terms of service: https://policies.google.com/terms
Google privacy policy: https://policies.google.com/privacy
Google reCAPTCHA: https://www.google.com/recaptcha/about/

== Source code ==

Compiled admin and guest-menu JavaScript ships in `public/admin/` and `public/pwa/`. The corresponding source and build tools are included in `admin-app/` and `pwa/` (run `npm install` then `npm run build` in each folder). Development repository: https://github.com/happybitesio/happybites

== Changelog ==

= 2.0.5 =
* Address Plugin Directory review notes: enqueue admin/PWA assets, field-aware settings sanitization, local jQuery UI, and review rate-limiting by REMOTE_ADDR

= 2.0.4 =
* Finish remaining Plugin Check warnings (escaping, prepared reviews queries, CLI scripts, hidden files)

= 2.0.3 =
* Plugin Check hardening: escaped admin output, sanitized settings, prepared SQL, and local filesystem APIs

= 2.0.2 =
* Plugin URI and Author URI are no longer the same (Author URI omitted)

= 2.0.1 =
* Guest-menu credit links are opt-in and off by default
* Load QR assets locally (no third-party CDN)
* Harden admin AJAX capability checks
* Include React source in the distribution package

= 2.0.0 =
* Complete rebuild with React admin and PWA frontend
* REST API and hosted MCP support (MCP requires HappyBites Pro)
* Theme presets, customer reviews, and reCAPTCHA v3
* Multi-language menu and privacy policy URL setting
* Guest-menu credit links are opt-in (off by default)
