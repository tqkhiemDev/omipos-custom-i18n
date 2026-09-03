# @khiemtq/i18n

A small, typed i18n toolkit for React clients and JavaScript servers. It lazy-loads translations by locale and namespace, provides key autocomplete from TypeScript resources, and ships ESM, CommonJS, and TypeScript declarations.

## Features

- One shared configuration for client and server code
- An explicit, typed registry of supported namespaces
- Lazy, deduplicated resource loading by locale and namespace
- TypeScript autocomplete for nested translation keys while still accepting dynamic keys
- **Automatic type inference from `defaultNamespace` and `initialNamespaces`**
- **Type-safe namespace prefixes (`namespace:key`) with multiple namespace support**
- React 18 and 19 provider/hook API
- Framework-neutral and server APIs
- Interpolation, locale-aware plural rules, text formatting, namespace fallback, and strict missing-key handling

## Installation

```sh
npm install @khiemtq/i18n react
```

The package exposes three entry points:

| Import | Purpose |
| --- | --- |
| `@khiemtq/i18n` | Configuration, utilities, types, and the framework-neutral `I18nInstance` |
| `@khiemtq/i18n/client` | React client, provider, and hook |
| `@khiemtq/i18n/server` | Async server translator |

## Quick start

### 1. Create translation resources

Keep resources as `const` objects to get autocomplete for their keys.

```ts
// locales/en/common.ts
import type { TranslationResource } from "@khiemtq/i18n";

export default {
  greeting: "Hello, {{name}}!",
  navigation: {
    settings: "Settings",
  },
  items: {
    one: "{{count}} item",
    other: "{{count}} items",
  },
} as const satisfies TranslationResource;
```

```ts
// locales/vi/common.ts
import type { TranslationResource } from "@khiemtq/i18n";

export default {
  greeting: "Xin chào, {{name}}!",
  navigation: {
    settings: "Cài đặt",
  },
  items: {
    other: "{{count}} mục",
  },
} as const satisfies TranslationResource;
```

Add another file for each namespace, for example `locales/en/dashboard.ts` and `locales/vi/dashboard.ts`.

### 2. Define the shared configuration

```ts
// i18n-config.ts
import {
  defineI18nConfig,
  type ResourceLoaders,
} from "@khiemtq/i18n";

export const locales = ["en", "vi"] as const;
export const namespaces = ["common", "dashboard"] as const;

export type Locale = (typeof locales)[number];
export type Namespace = (typeof namespaces)[number];

export const i18nConfig = defineI18nConfig({
  locales,
  namespaces,
  defaultLocale: "en",
  defaultNamespace: "common",
  initialNamespaces: ["dashboard"],
  resources: {
    en: {
      common: async () => (await import("./locales/en/common")).default,
      dashboard: async () => (await import("./locales/en/dashboard")).default,
    },
    vi: {
      common: async () => (await import("./locales/vi/common")).default,
      dashboard: async () => (await import("./locales/vi/dashboard")).default,
    },
  } satisfies ResourceLoaders<Locale, Namespace>,
});
```

A resource loader may return a translation object directly or through a promise. Dynamic imports let the runtime load only the requested locale and namespaces.

`locales` and `namespaces` are the authoritative lists used to infer the `Locale` and `Namespace` unions. Declaring them with `as const` constrains the defaults, initial namespaces, resource loaders, and client/server namespace arguments.

Every locale must define a loader for every configured namespace. `defineI18nConfig` also verifies at runtime that `defaultLocale` belongs to `locales` and `defaultNamespace` belongs to `namespaces`.

Listing a namespace does not load it eagerly. The client and server helpers load only the default, initial, and explicitly requested namespaces.

### 3. Create the React client

```ts
// i18n-client.ts
"use client"; // Required by frameworks such as Next.js App Router.

import { createI18nClient } from "@khiemtq/i18n/client";
import { i18nConfig } from "./i18n-config";

export const { I18nProvider, i18n, useTranslation } =
  createI18nClient(i18nConfig);
```

Wrap the client part of the app with the generated provider. The optional `locale` prop is useful when a framework resolves the locale on the server.

```tsx
<I18nProvider locale="vi">{children}</I18nProvider>
```

Call `useTranslation` with one namespace or a readonly namespace array:

```tsx
"use client";

import { useTranslation } from "./i18n-client";

export function Welcome() {
  const { i18n, j, langue, ready, t } = useTranslation(
    ["common", "dashboard"] as const,
  );

  if (!ready) return null;

  return (
    <section>
      <p>{t("greeting", { name: "Khiem" })}</p>
      <p>{t("navigation.settings")}</p>
      <p>{t("dashboard:title")}</p>
      <p>{j(["greeting", { name: "Khiem" }], "dashboard:ready")}</p>

      <button onClick={() => void i18n.changeLanguage("vi")}>
        Current locale: {langue}
      </button>
    </section>
  );
}
```

**Note:** When you pass multiple namespaces (e.g., `["common", "dashboard"]`), TypeScript will automatically infer the correct return type for translation keys:
- Keys without prefix (e.g., `t("greeting")`) will be typed from all provided namespaces
- Keys with namespace prefix (e.g., `t("dashboard:title")`) will be typed specifically from that namespace
- If a key exists in only one namespace, the return type will be properly inferred from that namespace's resource

The hook returns:

| Value | Description |
| --- | --- |
| `t(key, options?)` | Translator fixed to the requested namespace or namespaces |
| `j(...entries)` | Translates entries and joins them with a single space; returns `""` until the namespaces are ready |
| `ready` | `true` when every requested namespace is loaded for the active locale |
| `langue` | The active locale |
| `i18n` | The underlying `I18nClient` instance |

`I18nProvider` loads the default and initial namespaces. Each hook lazily loads its requested namespaces on mount, so treat the namespace argument as stable for that component instance. `changeLanguage` loads the active namespaces before publishing the new locale to subscribers.

### 4. Translate on the server

```ts
// i18n-server.ts
import { createI18nServer } from "@khiemtq/i18n/server";
import { i18nConfig } from "./i18n-config";

export const { getTranslation, i18n } = createI18nServer(i18nConfig);
```

`getTranslation` loads the default namespace, every initial namespace, and every namespace requested by the call before returning.

```ts
const { j, locale, t } = await getTranslation(
  "vi",
  ["common", "dashboard"] as const,
);

t("greeting", { name: "Khiem" });
t("dashboard:title");
j(["greeting", { name: "Khiem" }], "dashboard:ready");
```

Both arguments are optional. When `namespaces` is omitted, it automatically defaults to `[defaultNamespace, ...initialNamespaces]` from your config:

```ts
// If config has defaultNamespace: "common" and initialNamespaces: ["dashboard"]
const { t } = await getTranslation("vi");
// t is typed with ["common", "dashboard"]
// t("greeting") works and is typed from common.greeting
// t("dashboard:title") works and is typed from dashboard.title
```

You can also omit both arguments to use the default locale:

```ts
const { t } = await getTranslation();
// Uses defaultLocale and [defaultNamespace, ...initialNamespaces]
```

## Translation syntax

### Nested keys and namespaces

Use dot notation for nested values:

```ts
t("navigation.settings");
```

A fixed translator searches its requested namespaces in order, then falls back to `defaultNamespace`. Prefix a key with `namespace:` to select a namespace explicitly:

```ts
t("dashboard:title");
t("common:greeting", { name: "Khiem" });
```

Make sure the selected namespace has been requested by `useTranslation`, `getTranslation`, or `loadNamespaces` before translating from it.

Namespace fallback never crosses locale boundaries; translations do not fall back from one locale to another.

### Interpolation

Pass values for `{{variable}}` placeholders through the options object:

```ts
// Resource: "Hello, {{name}}!"
t("greeting", { name: "Khiem" }); // "Hello, Khiem!"
```

All occurrences of a supplied placeholder are replaced. `null` and `undefined` values become an empty string; placeholders without a matching option remain unchanged.

### Pluralization

Pass the numeric count as `c`. The plural category is selected with `Intl.PluralRules` for the active locale, and the count is available to both `{{count}}` and `{{c}}` placeholders.

```ts
// Resource:
// items: { one: "{{count}} item", other: "{{count}} items" }
t("items", { c: 1 }); // "1 item"
t("items", { c: 3 }); // "3 items"
```

Plural objects fall back to their `other` value when the selected category is absent. A two-item array is also supported: index `0` is used for `one`, and index `1` for every other category.

### Formatting and missing keys

Translation options reserve these short properties:

| Option | Meaning |
| --- | --- |
| `c: number` | Select a plural form and expose `count`/`c` for interpolation |
| `s: true` | Strict mode: return `""` instead of the missing key |
| `t: "lf"` | Lowercase the first character |
| `t: "l"` | Lowercase the complete result |
| `t: "u"` | Uppercase the complete result |
| `t: "c"` | Capitalize the first character |
| `t: "ca"` | Capitalize every space-separated word |

```ts
t("status", { t: "u" });
t("unknown.key"); // "unknown.key"
t("unknown.key", { s: true }); // ""
```

Inputs containing whitespace or `@` are treated as literal text and returned unchanged.

### Joining translations

The `j` helper returned by the React hook and server translator accepts keys or `[key, options]` tuples:

```ts
j(["greeting", { name: "Khiem" }], "dashboard:ready");
```

For a standalone translator, use the framework-neutral helper. Its entries are passed as an array:

```ts
import { joinTranslations } from "@khiemtq/i18n";

const message = joinTranslations(t, [
  ["greeting", { name: "Khiem" }],
  "dashboard:ready",
]);
```

## Configuration reference

| Property | Required | Description |
| --- | --- | --- |
| `locales` | Yes | Readonly array of supported locale codes |
| `namespaces` | Yes | Readonly array of supported namespace names and the source of the namespace union |
| `defaultLocale` | Yes | Initial locale and the default when a locale argument is omitted; must be included in `locales` |
| `defaultNamespace` | Yes | Namespace used when none is supplied and as the namespace fallback; must be included in `namespaces` |
| `initialNamespaces` | No | Supported namespaces loaded alongside the default namespace |
| `resources` | Yes | Loader matrix for every locale and namespace |

Use `isSupportedLocale` to validate an unknown value while preserving the locale union:

```ts
import { isSupportedLocale } from "@khiemtq/i18n";
import { i18nConfig, locales } from "./i18n-config";

const locale = isSupportedLocale(locales, value)
  ? value
  : i18nConfig.defaultLocale;
```

## API reference

### `@khiemtq/i18n`

- `defineI18nConfig(config)` returns the typed shared configuration and validates its default locale and namespace.
- `isSupportedLocale(locales, value)` is a runtime check and TypeScript type guard.
- `new I18nInstance(config)` creates the low-level, framework-neutral runtime.
- `joinTranslations(translator, entries)` translates and joins several entries.
- Exports the public configuration, resource, translation, and translator types.

Important `I18nInstance` methods are `loadNamespaces(locale, namespaces)`, `hasReady(locale, namespaces)`, `translate(key, locale, options?, namespaces?)`, and `getFixedT(locale, namespaces)`.

### `@khiemtq/i18n/client`

- `createI18nClient(config)` returns `I18nProvider`, `useTranslation`, and a shared `i18n` instance.
- `I18nClient` exposes `getLocale`, `hasReady`, `getFixedT`, `t`, `loadNamespaces`, `changeLanguage`, and `subscribe`.

Unsupported locales passed to `changeLanguage` are ignored. Validate external values with `isSupportedLocale` when an invalid locale should be handled explicitly.

### `@khiemtq/i18n/server`

- `createI18nServer(config)` returns `getTranslation` and the underlying `I18nInstance`.
- `getTranslation(locale?, namespaces?)` resolves to `{ locale, t, j }` after all required resources are ready.

Concurrent requests for the same locale and namespace share one pending loader. A failed loader is cleared so a later call can retry it.

## Local development

Install the root package and playground dependencies:

```sh
npm install
npm install --prefix playground
```

Useful commands:

```sh
npm run typecheck       # type-check the package
npm run build           # build ESM, CommonJS, source maps, and declarations
npm test                # build and run the Node.js test suite
npm run dev             # start the Next.js playground
npm run build:playground
npm run pack:dry-run    # inspect the package contents before publishing
```

The playground imports directly from `src/i18n`, so package changes are reflected while the development server is running. See [`playground`](./playground) for a Next.js App Router example with React Server Components, a client provider, locale cookies, interpolation, plurals, and language switching.

## Publishing

Sign in, inspect the packed files, and publish the public scoped package:

```sh
npm login
npm run pack:dry-run
npm publish
```

The `prepack` script builds the package and runs its tests before publication.

## License

[MIT](./LICENSE)
