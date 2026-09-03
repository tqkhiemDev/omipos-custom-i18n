import { isSupportedLocale } from "@khiemtq/i18n";
import { cookies } from "next/headers";

import { i18nConfig, locales, type Locale } from "./i18n-config";

export const LOCALE_COOKIE_NAME = "i18n-locale";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isSupportedLocale(locales, locale)
    ? locale
    : i18nConfig.defaultLocale;
}
