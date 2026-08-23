=== HappyBites – QR Code Food Menu ===
Contributors: happybitesteam
Tags: restaurant, menu, qr code, food menu, digital menu
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 2.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create a modern, mobile-friendly QR food menu for your restaurant, fully integrated with WordPress.

== Description ==

HappyBites helps restaurants publish a beautiful mobile menu that guests open by scanning a QR code.

* React-powered admin for menu, categories, products, settings, and reviews
* Fast PWA guest menu with multi-language support
* Theme presets and brand customization
* WiFi info, social links, working hours, and extra HTML content
* Customer reviews with Google reCAPTCHA v3 spam protection
* Hosted MCP endpoint for AI agent integrations

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/happybites`, or install through the WordPress plugins screen.
2. Activate the plugin through the **Plugins** screen.
3. Open **HappyBites** in the WordPress admin and configure your menu.
4. Share the menu URL or QR code with guests.

== Frequently Asked Questions ==

= Where is the guest menu URL? =

Go to **HappyBites → Settings → General**. The menu slug defines the public URL.

= How do I protect reviews from spam? =

Go to **HappyBites → Settings → Security** and add your Google reCAPTCHA v3 Site Key and Secret Key.

= Where is the privacy policy link shown? =

Under **Settings → Security** you can set a custom privacy policy URL. If left empty, guests are directed to the HappyBites privacy policy at https://happybites.io/privacy-policy

= Can AI agents manage my menu? =

Yes. Enable MCP under **HappyBites → Settings → MCP**, create a token, and add the provided `mcp.json` example to your agent.

== Privacy ==

The review form may collect optional name, email, comment, ratings, IP address, and browser user agent. Configure your privacy policy URL under **Settings → Security**, or the default HappyBites policy applies.

== Building a release ZIP ==

From the plugin root, run:

`powershell -ExecutionPolicy Bypass -File .\scripts\release.ps1`

This builds the admin and PWA bundles and creates `dist/happybites-<version>.zip`.

== Changelog ==

= 2.0.0 =
* Complete rebuild with React admin and PWA frontend
* REST API and hosted MCP support
* Theme presets, customer reviews, and reCAPTCHA v3
* Multi-language menu and privacy policy URL setting
