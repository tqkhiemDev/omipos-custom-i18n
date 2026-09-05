'use server';

import { isSupportedLocale } from '@omipos/i18n';
import { cookies } from 'next/headers';

import { locales } from '../i18n-config';
import { LOCALE_COOKIE_NAME } from '../server-locale';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleCookie(locale: string) {
    if (!isSupportedLocale(locales, locale)) {
        throw new Error(`Unsupported locale: ${locale}`);
    }

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, locale, {
        httpOnly: true,
        maxAge: ONE_YEAR,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
}
