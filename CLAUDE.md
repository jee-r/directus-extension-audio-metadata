# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Directus **operation** extension (flow step) that fetches an audio file from Directus assets and extracts its metadata (primarily duration) using [music-metadata](https://github.com/borewit/music-metadata). Built with `@directus/extensions-sdk`.

## Commands

```bash
pnpm install        # install deps
pnpm run build       # production build via directus-extension build
pnpm run dev         # watch build, no minify (directus-extension build -w --no-minify)
pnpm run link        # link extension into a local Directus instance (directus-extension link)
pnpm run validate    # validate the extension (directus-extension validate)
pnpm run changelog   # regenerate CHANGELOG.md from conventional commits
```

There is no test suite and no linter configured — `pnpm run validate` (via extensions-sdk) is the main correctness check, along with `tsc` type-checking during build.

Note: CI (`.github/workflows/*.yml`) and `package-lock.json` use npm, since that's what GitHub Actions runs — use `npm`/`npm ci` only when mirroring/debugging those workflows; use `pnpm` for local development per usual.

## Architecture

Directus operation extensions have two entry points, declared in `package.json` under `directus:extension`:

- **`src/app.ts`** — the "app" side, runs in the Directus admin UI. Defines the operation's form (`defineOperationApp`): its id (`audio-metadata`), name, icon, the options panel fields (`fileKey`, `baseUrl`, `accessToken`, `maxBytes`, `downloadFullFile`), and the `overview` summary shown on the flow graph node. This is pure config/metadata — no business logic.
- **`src/api.ts`** — the "api" side, runs server-side when the flow executes. Defines the actual handler (`defineOperationApi`) that:
  1. Builds the asset URL as `${baseUrl}/${fileKey}`.
  2. Fetches it — either the full file, or just the first `maxBytes` via an HTTP `Range` header (default 256KB), controlled by `downloadFullFile`. This range-read is the core optimization: most audio metadata lives in the file header, so a full download is normally unnecessary (but can be required for accurate duration on some formats/longer files).
  3. Parses the buffer with `music-metadata`'s `parseBuffer`, with `skipCovers: true` to keep responses small.
  4. Returns `{ durationms, file_url, usedFullFile }` to the flow (note: the full `metadata` object is intentionally commented out of the return, not exposed to flows currently).

Both files must stay in sync for option fields: a field read in `api.ts`'s `Options` type must have a corresponding UI field in `app.ts`'s `options` array (and vice versa), since there's no shared schema between them.

`src/shims.d.ts` declares `*.vue` modules for TypeScript, though this extension currently has no `.vue` components (app side uses only JS config, not custom Vue components).

## Versioning / releases

- Releases are tag-triggered (`.github/workflows/release.yml`): pushing a tag builds and publishes to both GitHub Packages and npm (via OIDC trusted publishing).
- `CHANGELOG.md` is generated via `conventional-changelog`, so commits should follow the Conventional Commits format (already a global preference: `type(scope): message`).
