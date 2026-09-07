import { defineI18nConfig, ResourceLoaders } from '@omipos/i18n';

export const locales = ['en', 'vi'] as const;

// export enum Namespace {
//     COMMON = 'common',
//     PLAYGROUND = 'playground',
// }

// Type-level array for inference engine
export const namespaces = ['common', 'playground'] as const;
type NamespaceType = (typeof namespaces)[number];

export type Locale = (typeof locales)[number];

export const i18nConfig = defineI18nConfig({
    locales,
    namespaces,
    defaultLocale: 'vi',
    defaultNamespace: 'common',
    initialNamespaces: ['common'],
    resources: {
        en: {
            common: async () => (await import('./locales/en/common')).default,
            playground: async () => (await import('./locales/en/playground')).default,
        },
        vi: {
            common: async () => (await import('./locales/vi/common')).default,
            playground: async () => (await import('./locales/vi/playground')).default,
        },
    } satisfies ResourceLoaders<Locale, NamespaceType>,
});
