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

Use `.distignore` when creating a WordPress distribution zip. Source folders (`admin-app/`, `pwa/`) are excluded; built assets in `public/` are shipped.

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
