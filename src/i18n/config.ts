import type { I18nConfig, ResourceLoaders } from "./types";

export function defineI18nConfig<
  Locale extends string,
  Namespace extends string,
  Resource extends ResourceLoaders<Locale, Namespace>,
  DefaultNS extends Namespace = Namespace,
  InitialNS extends readonly Namespace[] = readonly Namespace[],
>(
  config: I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS>,
): I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS> {
  if (!config.locales.includes(config.defaultLocale)) {
    throw new Error("defaultLocale must be included in locales");
  }

  if (!config.namespaces.includes(config.defaultNamespace)) {
    throw new Error("defaultNamespace must be included in namespaces");
  }

  return config;
}

export function isSupportedLocale<Locale extends string>(
  locales: readonly Locale[],
  value: unknown,
): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
