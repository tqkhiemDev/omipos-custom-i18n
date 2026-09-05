import { describe, expect, test } from 'vitest';
import { I18nClient } from '../src/i18n/client';
import { I18nInstance, defineI18nConfig, isSupportedLocale, joinTranslations } from '../src/i18n/index';
import { createI18nServer } from '../src/i18n/server';

const resources = {
    en: {
        common: async () => ({
            greeting: 'Hello {{name}}',
            nested: { label: 'Settings' },
            items: { one: '{{count}} item', other: '{{count}} items' },
        }),
        feature: async () => ({ title: 'Feature' }),
    },
    vi: {
        common: async () => ({
            greeting: 'Xin chao {{name}}',
            nested: { label: 'Cai dat' },
            items: { other: '{{count}} muc' },
        }),
        feature: async () => ({ title: 'Tinh nang' }),
    },
};

const config = defineI18nConfig({
    locales: ['en', 'vi'],
    namespaces: ['common', 'feature'],
    defaultLocale: 'en',
    defaultNamespace: 'common',
    resources,
});

describe('i18n', () => {
    test('validates and narrows supported locales', () => {
        expect(isSupportedLocale(config.locales, 'vi')).toBe(true);
        expect(isSupportedLocale(config.locales, 'fr')).toBe(false);
        expect(() =>
            defineI18nConfig({
                locales: ['en'] as const,
                namespaces: ['common'] as const,
                defaultLocale: 'vi' as any,
                defaultNamespace: 'common',
                resources: {
                    en: { common: async () => ({}) },
                },
            }),
        ).toThrow(/defaultLocale must be included in locales/);
    });

    test('loads, translates, interpolates, and pluralizes resources', async () => {
        const i18n = new I18nInstance(config);
        await i18n.loadNamespaces('en', ['common', 'feature']);

        expect(i18n.translate('greeting', 'en', { name: 'Khiem' })).toBe('Hello Khiem');
        expect(i18n.translate('nested.label', 'en')).toBe('Settings');
        expect(i18n.translate('feature:title', 'en')).toBe('Feature');
        expect(i18n.translate('items', 'en', { c: 1 })).toBe('1 item');
        expect(i18n.translate('items', 'en', { c: 3 })).toBe('3 items');
        expect(i18n.translate('missing', 'en')).toBe('missing');
        expect(i18n.translate('missing', 'en', { s: true })).toBe('');
    });

    test('deduplicates concurrent namespace loads', async () => {
        let loads = 0;
        const dedupeConfig = defineI18nConfig({
            locales: ['en'] as const,
            defaultLocale: 'en',
            defaultNamespace: 'common',
            namespaces: ['common', 'feature'] as const,
            resources: {
                en: {
                    common: async () => {
                        loads += 1;
                        return { ready: 'Ready' };
                    },
                    feature: async () => ({ title: 'Feature' }),
                },
            },
        });
        const i18n = new I18nInstance(dedupeConfig);

        await Promise.all([i18n.loadNamespaces('en', 'common'), i18n.loadNamespaces('en', 'common')]);

        expect(loads).toBe(1);
        expect(i18n.translate('ready', 'en')).toBe('Ready');
    });

    test('loads client resources and changes the active locale', async () => {
        const i18n = new I18nClient(config);
        let changes = 0;
        const unsubscribe = i18n.subscribe(() => {
            changes += 1;
        });

        await i18n.loadNamespaces('common');
        await i18n.changeLanguage('vi');

        expect(i18n.getLocale()).toBe('vi');
        expect(i18n.getFixedT('common')('greeting', { name: 'Khiem' })).toBe('Xin chao Khiem');
        expect(changes).toBe(2);
        unsubscribe();
    });

    test('creates fixed server translators and joins translated values', async () => {
        const { getTranslation } = createI18nServer(config);
        const { t, j, locale } = await getTranslation('vi', ['common', 'feature']);

        expect(locale).toBe('vi');
        expect(t('feature:title')).toBe('Tinh nang');
        expect(j(['greeting', { name: 'Khiem' }], 'feature:title')).toBe('Xin chao Khiem Tinh nang');
        expect(joinTranslations(t, ['nested.label', 'feature:title'])).toBe('Cai dat Tinh nang');
    });
});
