import type {
    I18nConfig,
    InternalFixedT,
    JoinTranslatorArg,
    NamespaceInput,
    ResourceLoaders,
    TranslateOptions,
} from './types';

import {
    createContext,
    createElement,
    useContext,
    useEffect,
    useMemo,
    useSyncExternalStore,
    type ReactNode,
} from 'react';

import { I18nInstance, joinTranslations } from './instance';

export class I18nClient<
    Locale extends string,
    Namespace extends string,
    Resource extends ResourceLoaders<Locale, Namespace>,
    DefaultNS extends Namespace = Namespace,
    InitialNS extends readonly Namespace[] = readonly Namespace[],
> {
    private readonly instance: I18nInstance<Locale, Namespace, Resource, DefaultNS, InitialNS>;
    private readonly listeners = new Set<() => void>();
    private readonly activeNamespaces = new Set<Namespace>();
    private version = 0;
    private languageRequest = 0;

    constructor(
        public readonly config: I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS>,
        private locale: Locale = config.defaultLocale,
    ) {
        this.instance = new I18nInstance(config);
        this.activeNamespaces.add(config.defaultNamespace);
        for (const namespace of config.initialNamespaces ?? []) {
            this.activeNamespaces.add(namespace);
        }
    }

    getLocale = () => this.locale;

    getSnapshot = () => this.version;

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    hasReady(namespaces: NamespaceInput<Namespace>) {
        return this.instance.hasReady(this.locale, namespaces);
    }

    getFixedT<Ns extends NamespaceInput<Namespace>>(namespaces: Ns) {
        const fixedT: InternalFixedT<Ns, Resource, DefaultNS, InitialNS> = (key, opts) => {
            return this.instance.translate(key, this.locale, opts, namespaces) as any;
        };

        return fixedT;
    }

    t(input: string, opts?: TranslateOptions, namespaces?: NamespaceInput<Namespace>) {
        return this.instance.translate(input, this.locale, opts, namespaces);
    }

    async loadNamespaces(namespaces: NamespaceInput<Namespace>) {
        const namespaceList = Array.isArray(namespaces) ? namespaces : [namespaces];
        for (const namespace of namespaceList) {
            this.activeNamespaces.add(namespace);
        }

        const wasReady = this.instance.hasReady(this.locale, namespaceList);
        await this.instance.loadNamespaces(this.locale, namespaceList);
        if (!wasReady) this.emitChange();
    }

    async changeLanguage(locale: Locale) {
        if (!this.config.locales.includes(locale)) return;

        const request = ++this.languageRequest;
        if (locale === this.locale) return;

        do {
            await this.instance.loadNamespaces(locale, [...this.activeNamespaces]);

            if (request !== this.languageRequest) return;
        } while ([...this.activeNamespaces].some((namespace) => !this.instance.hasReady(locale, namespace)));

        this.locale = locale;
        this.emitChange();
    }

    private emitChange() {
        this.version += 1;
        for (const listener of this.listeners) listener();
    }
}

export const createI18nClient = <
    Locale extends string,
    Namespace extends string,
    Resource extends ResourceLoaders<Locale, Namespace>,
    DefaultNS extends Namespace = Namespace,
    InitialNS extends readonly Namespace[] = readonly Namespace[],
>(
    config: I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS>,
) => {
    const i18n = new I18nClient(config);
    const I18nContext = createContext<I18nClient<Locale, Namespace, Resource, DefaultNS, InitialNS> | null>(null);

    type I18nProviderProps = {
        readonly children: ReactNode;
        readonly locale?: Locale;
    };

    const I18nProvider = ({ children, locale = config.defaultLocale }: I18nProviderProps) => {
        useEffect(() => {
            void i18n.changeLanguage(locale).catch((error: unknown) => {
                console.error('Failed to change i18n locale', error);
            });
        }, [locale]);

        useEffect(() => {
            void i18n
                .loadNamespaces([
                    config.defaultNamespace,
                    ...(config.initialNamespaces ?? []),
                ])
                .catch((error: unknown) => {
                    console.error('Failed to load initial i18n namespaces', error);
                });
        }, []);

        return createElement(I18nContext.Provider, { value: i18n }, children);
    };

    const useTranslation = <Ns extends NamespaceInput<Namespace>>(namespace?: Ns) => {
        const i18n = useContext(I18nContext);
        if (!i18n) {
            throw new Error('useTranslation must be used within I18nProvider');
        }
        const actualNamespace = (namespace ?? config.defaultNamespace) as Ns;
        const ready = i18n.hasReady(actualNamespace);
        const locale = i18n.getLocale();

        const version = useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, i18n.getSnapshot);

        const t = useMemo(
            () => i18n.getFixedT(actualNamespace),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [
                version,
            ],
        );

        useEffect(
            () => {
                void i18n.loadNamespaces(actualNamespace).catch((error: unknown) => {
                    console.error('Failed to load i18n namespace', error);
                });
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [],
        );

        return {
            ready,
            i18n,
            langue: locale,
            t,
            j: (...args: JoinTranslatorArg[]) => (ready ? joinTranslations(t, args) : ''),
        };
    };

    return {
        I18nProvider,
        useTranslation,
        i18n,
    };
};
