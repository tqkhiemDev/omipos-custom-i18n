import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createI18nClient } from '../src/i18n/client';
import { defineI18nConfig } from '../src/i18n/config';
import { createElement } from 'react';

const resources = {
    en: {
        common: async () => ({
            greeting: 'Hello {{name}}',
            welcome: 'Welcome',
        }),
        feature: async () => ({ title: 'Feature' }),
    },
    vi: {
        common: async () => ({
            greeting: 'Xin chao {{name}}',
            welcome: 'Chao mung',
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

describe('useTranslation hook', () => {
    test('renders translated text with useTranslation hook', async () => {
        const { I18nProvider, useTranslation } = createI18nClient(config);

        function TestComponent() {
            const { t } = useTranslation('common');
            return createElement('div', { 'data-testid': 'greeting' }, t('welcome'));
        }

        render(createElement(I18nProvider, { children: createElement(TestComponent) }));

        await waitFor(() => {
            expect(screen.getByTestId('greeting').textContent).toBe('Welcome');
        });
    });

    test('interpolates variables in translation', async () => {
        const { I18nProvider, useTranslation } = createI18nClient(config);

        function TestComponent() {
            const { t } = useTranslation('common');
            return createElement('div', { 'data-testid': 'message' }, t('greeting', { name: 'Khiem' }));
        }

        render(createElement(I18nProvider, { children: createElement(TestComponent) }));

        await waitFor(() => {
            expect(screen.getByTestId('message').textContent).toBe('Hello Khiem');
        });
    });

    test('changes language and re-renders', async () => {
        const { I18nProvider, useTranslation, i18n } = createI18nClient(config);

        function TestComponent() {
            const { t } = useTranslation('common');
            return createElement('div', { 'data-testid': 'text' }, t('welcome'));
        }

        const { rerender } = render(createElement(I18nProvider, { children: createElement(TestComponent) }));

        await waitFor(() => {
            expect(screen.getByTestId('text').textContent).toBe('Welcome');
        });

        await i18n.changeLanguage('vi');

        rerender(createElement(I18nProvider, { children: createElement(TestComponent) }));

        await waitFor(() => {
            expect(screen.getByTestId('text').textContent).toBe('Chao mung');
        });
    });

    test('loads multiple namespaces', async () => {
        const { I18nProvider, useTranslation } = createI18nClient(config);

        function TestComponent() {
            const { t } = useTranslation(['common', 'feature']);
            return createElement(
                'div',
                {},
                createElement('span', { 'data-testid': 'common' }, t('welcome')),
                createElement('span', { 'data-testid': 'feature' }, t('feature:title')),
            );
        }

        render(createElement(I18nProvider, { children: createElement(TestComponent) }));

        await waitFor(() => {
            expect(screen.getByTestId('common').textContent).toBe('Welcome');
            expect(screen.getByTestId('feature').textContent).toBe('Feature');
        });
    });
});
