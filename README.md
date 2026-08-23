# HappyBites v2

WordPress plugin for QR food menus with a React admin, PWA guest experience, REST API, and hosted MCP.

## What's included in a release

| Path | Purpose |
|------|---------|
| `includes/` | PHP plugin core |
| `admin/` | WordPress admin shell assets |
| `public/admin/` | Built React admin app |
| `public/pwa/` | Built guest menu PWA |
| `public/css/`, `public/js/`, `public/views/` | Shortcode and public assets |
| `languages/` | Translation files |

## Development

### Admin app

```bash
cd admin-app
npm install
npm run dev
npm run build
```

Build output: `public/admin/`

### PWA

```bash
cd pwa
npm install
npm run dev
npm run build
```

Build output: `public/pwa/`

### Release zip

From the **plugin root** (`happybites/`), run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release.ps1
```

This will:

1. Run `npm run build` in `admin-app/` and `pwa/`
2. Stage files using `.distignore`
3. Create `dist/happybites-<version>.zip` (e.g. `dist/happybites-2.0.0.zip`)

To skip builds and package existing `public/admin` and `public/pwa` output:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release.ps1 -SkipBuild
```

Upload the ZIP via **WordPress → Plugins → Add New → Upload Plugin**.

Source folders (`admin-app/`, `pwa/`) are excluded from the zip; built assets in `public/` are shipped.

#### Updating without losing data

Your menu, settings, and reviews live in the database. **Do not click Delete** on the plugin — that runs `uninstall.php` and removes everything.

Safe upgrade:

1. **Deactivate** the plugin (do not delete)
2. Upload the new ZIP (**Plugins → Add New → Upload Plugin**)
3. WordPress replaces files in `wp-content/plugins/happybites/`
4. **Activate** again
5. **Settings → Permalinks → Save** (flush rewrite rules)

Alternatively, replace files over FTP in `wp-content/plugins/happybites/` without removing the folder.

| Action | Data safe? |
|--------|------------|
| Deactivate → upload ZIP → activate | Yes |
| FTP file replace | Yes |
| Upload ZIP while plugin is active | Usually yes (WordPress overwrites files) |
| **Delete** plugin | **No** — wipes options, products, categories, reviews |

#### Fresh install on a site that already has HappyBites

If WordPress cannot overwrite the existing folder, it may create `happybites-1` and show duplicate plugin entries. In that case, deactivate the old copy, remove the extra folder via FTP, then upload again — or replace files in the existing `happybites/` folder directly.

## REST API

Base namespace: `/wp-json/happybites/v1`

### Public

- `GET /menu`
- `POST /review`

### Admin

- Menu, categories, products, settings, reviews
- MCP settings: `GET|PUT /admin/mcp`, `POST /admin/mcp/rotate`

### MCP (agent access)

- `POST /mcp` with `Authorization: Bearer <token>`
