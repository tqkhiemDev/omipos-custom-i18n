import { defineI18nConfig, ResourceLoaders } from '@omipos/i18n';

export const locales = ['en', 'vi'] as const;
export const namespaces = ['common', 'playground'] as const;

export type Locale = (typeof locales)[number];
export type Namespace = (typeof namespaces)[number];

export const i18nConfig = defineI18nConfig({
    locales,
    namespaces,
    defaultLocale: 'vi',
    defaultNamespace: 'playground',
    initialNamespaces: ['common', 'playground'],
    resources: {
        en: {
            common: async () => (await import('./locales/en/common')).default,
            playground: async () => (await import('./locales/en/playground')).default,
        },
        vi: {
            common: async () => (await import('./locales/vi/common')).default,
            playground: async () => (await import('./locales/vi/playground')).default,
        },
    } satisfies ResourceLoaders<Locale, Namespace>,
});
