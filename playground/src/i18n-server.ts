import { createI18nServer } from '@omipos/i18n/server';

import { i18nConfig } from './i18n-config';

export const { getTranslation, i18n } = createI18nServer(i18nConfig);
