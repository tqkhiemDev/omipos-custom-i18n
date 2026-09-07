import type {
    I18nConfig,
    InternalFixedT,
    JoinTranslatorArg,
    NamespaceInput,
    ResourceLoaders,
    DefaultNamespaces,
} from './types';

import { I18nInstance, isArray, joinTranslations } from "./instance";

export const createI18nServer = <
  Locale extends string,
  Namespace extends string,
  Resource extends ResourceLoaders<Locale, Namespace>,
  DefaultNS extends Namespace = Namespace,
  InitialNS extends readonly Namespace[] = readonly Namespace[],
>(
  config: I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS>,
) => {
  const i18n = new I18nInstance<Locale, Namespace, Resource, DefaultNS, InitialNS>(config);

  const getTranslation = async <
    Ns extends NamespaceInput<Namespace> = DefaultNamespaces<typeof config>
  >(
    locale: Locale = config.defaultLocale,
    namespaces?: Ns,
  ): Promise<{
    locale: Locale;
    t: InternalFixedT<Ns, Resource, DefaultNS, InitialNS>;
    j: (...args: JoinTranslatorArg[]) => string;
  }> => {
    const actualNamespaces = (namespaces ??
      (config.initialNamespaces
        ? ([config.defaultNamespace, ...config.initialNamespaces] as const)
        : ([config.defaultNamespace] as const)
      )) as Ns;

    const requestedNamespaces: Namespace[] = isArray(actualNamespaces)
      ? actualNamespaces
      : [actualNamespaces];

    const namespacesToLoad = [
      ...new Set([
        config.defaultNamespace,
        ...(config.initialNamespaces ?? []),
        ...requestedNamespaces,
      ]),
    ];

    await i18n.loadNamespaces(locale, namespacesToLoad);

    const t = i18n.getFixedT(locale, actualNamespaces);

    return {
      locale,
      t,
      j: (...args: JoinTranslatorArg[]) => joinTranslations(t, args),
    };
  };

  return {
    i18n,
    getTranslation,
  };
};
