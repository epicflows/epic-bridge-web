# CLAUDE.md — EPIC Bridge Web

This file provides context for AI assistants (Claude Code and others) working in this repository.

---

## Project Overview

**epic-bridge-web** is a lightweight serverless API bridge that exposes Instagram public data (profile info and recent posts) via simple GET endpoints. It is deployed on **Vercel** and written entirely in Node.js (CommonJS).

There is no framework, bundler, build step, or test suite — the project is intentionally minimal.

---

## Repository Structure

```
epic-bridge-web/
├── api/
│   ├── openapi.json              # OpenAPI 3.0.1 spec for the two endpoints
│   └── instagram/
│       ├── profile.js            # GET /instagram/profile handler
│       └── posts.js              # GET /instagram/posts handler
├── public/
│   └── index.html                # Static landing page listing available endpoints
├── package.json                  # Single dependency: node-fetch ^2.6.7
├── vercel.json                   # Vercel route configuration
└── CLAUDE.md                     # This file
```

---

## API Endpoints

Both endpoints require a `token` query parameter for authentication (validated against the `BRIDGE_TOKEN` environment variable; defaults to `"demo"` when not set).

### `GET /instagram/profile`

Fetches public profile data for an Instagram user.

| Query param | Required | Description |
|-------------|----------|-------------|
| `user`      | yes      | Instagram username (no `@`) |
| `token`     | yes      | Auth token matching `BRIDGE_TOKEN` env var |

**Response (200):**
```json
{
  "username": "string",
  "full_name": "string",
  "bio": "string",
  "followers": 12345,
  "following": 678,
  "posts": 90,
  "profile_pic": "https://..."
}
```

### `GET /instagram/posts`

Fetches recent posts for an Instagram user.

| Query param | Required | Default | Description |
|-------------|----------|---------|-------------|
| `user`      | yes      | —       | Instagram username |
| `token`     | yes      | —       | Auth token |
| `limit`     | no       | `5`     | Max number of posts to return |

**Response (200):** Array of post objects with `id`, `shortcode`, `date` (ISO 8601), `caption`, `likes`, `comments`, `display_url`, `is_video`, `media_url`.

### `GET /api/openapi.json`

Static OpenAPI 3.0.1 spec (served directly from `api/openapi.json`).

---

## How Scraping Works

Both handlers:
1. Fetch the public Instagram profile page (`https://www.instagram.com/<user>/`) with a generic `User-Agent` header.
2. Extract the embedded `<script id="__NEXT_DATA__">` JSON blob from the HTML.
3. Navigate the parsed JSON tree: `data.props.pageProps.user`.
4. Return a shaped subset of that data.

**Important:** Instagram's page structure (`__NEXT_DATA__`) can change without notice. If handlers start throwing 500 errors with parse failures, this path has likely changed.

---

## Environment Variables

| Variable       | Required | Default  | Purpose |
|----------------|----------|----------|---------|
| `BRIDGE_TOKEN` | no       | `"demo"` | Shared secret token that callers must supply as `?token=` in requests |

Set `BRIDGE_TOKEN` in the Vercel project settings (or a local `.env` file when running `vercel dev`).

---

## Development Workflow

### Prerequisites

- Node.js (v16+ recommended)
- Vercel CLI: `npm i -g vercel`

### Local development

```bash
npm install          # installs node-fetch
npm start            # runs: vercel dev
```

`vercel dev` reads `vercel.json` to set up routes and serves handlers locally, mirroring the production environment.

### Deployment

```bash
vercel --prod
```

No build step is needed. Vercel deploys each `api/**/*.js` file as a serverless function.

---

## Routing

`vercel.json` maps public URL paths to handler files:

| Public path            | Handler file                      |
|------------------------|-----------------------------------|
| `/instagram/profile`   | `api/instagram/profile.js`        |
| `/instagram/posts`     | `api/instagram/posts.js`          |

Note: the static `public/index.html` still references `/api/instagram/...` paths (the Vercel default for files under `api/`). The canonical routes exposed by `vercel.json` are the shorter `/instagram/...` paths.

---

## Key Conventions

- **CommonJS only** (`require` / `module.exports`). Do not introduce ESM (`import`/`export`) without updating `package.json` and all files.
- **No transpilation.** Code runs directly in Node.js. Avoid syntax that requires a compiler.
- **node-fetch v2** (not v3). v2 is CommonJS-compatible; v3 is ESM-only. Do not upgrade to v3 without migrating to ESM.
- **Handler signature:** Every Vercel serverless handler exports a single default async function `(req, res) => { ... }`.
- **Auth check first:** Both handlers validate `token` before doing any I/O. Keep this pattern when adding new handlers.
- **Minimal dependencies.** This project intentionally has one dependency. Prefer native Node.js APIs over adding new packages.
- **No tests currently exist.** If adding tests, use a framework compatible with CommonJS (e.g., Jest with default config).

---

## Adding a New Endpoint

1. Create `api/<platform>/<action>.js` following the pattern in existing handlers.
2. Export `async (req, res) => { ... }`.
3. Add a route entry to `vercel.json`.
4. Document the new endpoint in `api/openapi.json` and `public/index.html`.

---

## Git Branches

| Branch    | Purpose |
|-----------|---------|
| `master`  | Stable production branch |
| `main`    | Remote default branch (origin) |
| `claude/…`| AI-assistant working branches |

---

## Known Limitations / Fragile Points

- **Instagram scraping is fragile.** The `__NEXT_DATA__` JSON structure changes when Instagram updates their frontend. Handlers will throw a 500 error with a parse message when this happens.
- **No rate limiting.** Repeated calls will hammer Instagram directly from the Vercel function IPs, which may trigger IP blocks.
- **Token is a shared secret passed in the query string.** It will appear in server logs and browser history. For higher-security use, move auth to a header.
- **`BRIDGE_TOKEN` defaults to `"demo"`.** In production, always set a strong secret via the Vercel environment variable.
