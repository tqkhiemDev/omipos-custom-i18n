# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@omipos/i18n` — a small, typed i18n toolkit (npm package) with three entry points: root (`@omipos/i18n`), `/client` (React), `/server` (async server translator). React is a peer dependency and is externalized in the build.

## Commands

```sh
npm install                    # root deps
npm install --prefix playground # playground deps (first time only)

npm run typecheck              # tsc --noEmit over src/i18n + vite.config.ts
npm run build                  # typecheck + vite build (ESM/CJS/sourcemaps) + tsc declarations -> dist/
npm test                       # build first, then run node --test on tests/*.test.mjs
node --test tests/i18n.test.mjs          # run tests only (requires a prior build)
node --test --test-name-pattern="<name>" tests/i18n.test.mjs  # run a single test

npm run dev                    # Next.js playground (imports directly from src/i18n)
npm run build:playground
npm run pack:dry-run           # inspect package contents; prepack runs `npm test`
```

Tests import from `dist/`, not `src/` — always rebuild (`npm run build`) before trusting test results after a source change.

## Architecture

Source lives in [src/i18n/](src/i18n/) (flat, 5 files, ~790 lines total):

- **types.ts** — all shared types plus the entire type-level key inference engine. `TranslateKeyWithNamespace` builds the autocomplete union (plain keys from requested namespaces + `namespace:key` prefixed keys); `TranslateReturnType` resolves the literal return type of a known key per namespace/array/prefixed case. Change behavior here first — runtime code is typed against it.
- **instance.ts** — `I18nInstance`, the framework-neutral runtime: resource cache (`Map<locale, Map<namespace, resource>>`), deduplicated in-flight loader promises (failed loaders are evicted so later calls retry), key resolution (`namespace:` prefix, dot-path lookup incl. array indices), interpolation, `Intl.PluralRules` pluralization, text formatting (`t` option), strict-mode missing-key handling. Also exports `joinTranslations`.
- **config.ts** — `defineI18nConfig` (identity function at runtime; validates defaultLocale/defaultNamespace membership) and `isSupportedLocale` type guard.
- **client.ts** — `I18nClient` wraps `I18nInstance` with a locale + active-namespaces set, a version counter driving `useSyncExternalStore`, and race-safe `changeLanguage` (monotonic request id; loads all active namespaces before publishing the new locale). `createI18nClient` returns `I18nProvider` / `useTranslation` / shared `i18n`. The hook's `t`/namespace loading are keyed off mount only — the namespace argument is treated as stable per component instance.
- **server.ts** — `createI18nServer` returns `getTranslation(locale?, namespaces?)` which awaits default + initial + explicitly requested namespaces, then hands back `{ locale, t, j }`. Namespaces default to `DefaultNamespaces<typeof config>` (inferred from `defaultNamespace` + `initialNamespaces`).

Layering: `types.ts` <- `instance.ts` <- {`client.ts`, `server.ts`}; `index.ts` re-exports config + instance + all types.

### Key runtime conventions

- Short reserved translation options (`c` count, `index`, `s` strict, `t` format) are documented in README and destructured in `I18nInstance.translate`; remaining option keys become interpolation variables.
- Keys containing whitespace or `@` are returned as literal text, untranslated.
- Namespace fallback always appends `defaultNamespace` to the tried list; there is no cross-locale fallback.
- The generics `DefaultNS`/`InitialNS` on `I18nConfig` exist to carry the literal types of `defaultNamespace`/`initialNamespaces` through to `getTranslation`'s default namespace type — preserve them when touching signatures.

## Formatting

Prettier config in [.prettierrc](.prettierrc): **4-space tabs, single quotes, printWidth 120, trailing commas everywhere** (src/i18n follows this; playground files use 2-space/README style — match the file you edit). VS Code formats on save with organize-imports.

## Playground

[playground/](playground/) is a private Next.js App Router app that imports directly from `src/i18n` (via the shared turbopack root in [playground/next.config.mjs](playground/next.config.mjs)), so library edits hot-reload without rebuilding `dist`. Use it to verify React/RSC behavior end-to-end; use `npm test` for runtime logic.

## Other

- `.npmrc` points npm cache at local `.npm-cache/`; `dist/`, `tests/`, `playground/.next/` are gitignored (test suite is local-only and not published).
- [test-types.ts](test-types.ts) is a scratch type-inference check, excluded from tsconfig `include` — not part of build or tests.
- Version bumps happen via commits like `2.0.2`; publishing uses `npm publish` (public scoped package) after `npm run pack:dry-run`.
