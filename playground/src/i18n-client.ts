'use client';

import { createI18nClient } from '@omipos/i18n/client';

import { i18nConfig } from './i18n-config';

export const { I18nProvider, i18n, useTranslation } = createI18nClient(i18nConfig);
