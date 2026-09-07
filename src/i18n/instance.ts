import {
    FormatTextType,
    I18nConfig,
    InternalFixedT,
    JoinTranslatorArg,
    NamespaceInput,
    ResourceLoaders,
    TranslateKeyWithNamespace,
    TranslateOptions,
    TranslateReturnType,
    TranslationResource,
    TranslationValue,
} from './types';

const formatText = (type: FormatTextType, str?: string) => {
    str = String(str ?? '');
    switch (type) {
        case 'lf':
            return str[0].toLowerCase() + str.substring(1);
        case 'l':
            return str.toLowerCase();
        case 'u':
            return str.toUpperCase();
        case 'c':
            return capitalizeStr(str);
        case 'ca':
            return capitalizeStr(str, true);
        default:
            return str;
    }
};

const capitalizeStr = (str?: string, all?: boolean) => {
    str = String(str ?? '').trim();
    if (!str) return '';
    const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);
    return all ? str.split(' ').map(capitalize).join(' ') : capitalize(str);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isArray = (val: any) => Array.isArray(val);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const toNamespaceList = <Namespace extends string>(input: NamespaceInput<Namespace>) =>
    (Array.isArray(input) ? input : [input]) as readonly Namespace[];

const getPluralCategory = (locale: string, count: number) => {
    try {
        return new Intl.PluralRules(locale).select(count);
    } catch {
        return count === 1 ? 'one' : 'other';
    }
};

export const joinTranslations = <
    Ns extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
    DefaultNS extends string = string,
    InitialNS extends readonly string[] = readonly string[],
>(
    translator: InternalFixedT<Ns, Resource, DefaultNS, InitialNS>,
    args: readonly JoinTranslatorArg[],
) => args.map((input) => (isArray(input) ? translator(input[0], input[1]) : translator(input as string))).join(' ');

export class I18nInstance<
    Locale extends string,
    Namespace extends string,
    Resource extends ResourceLoaders<Locale, Namespace>,
    DefaultNS extends Namespace = Namespace,
    InitialNS extends readonly Namespace[] = readonly Namespace[],
> {
    constructor(public readonly config: I18nConfig<Locale, Namespace, Resource, DefaultNS, InitialNS>) {}

    private readonly resources = new Map<Locale, Map<Namespace, TranslationResource>>();

    private readonly loading = new Map<Locale, Map<Namespace, Promise<void>>>();

    translate<Ns extends NamespaceInput<Namespace>, Input extends TranslateKeyWithNamespace<Ns, Resource>>(
        input: Input,
        locale: Locale,
        options?: TranslateOptions,
        namespaces?: Ns,
    ): TranslateReturnType<Ns, Resource, Input> {
        const key = String(input);
        if (!input) return '' as unknown as TranslateReturnType<Ns, Resource, Input>;

        if (/[@\s]/.test(key)) return key as unknown as TranslateReturnType<Ns, Resource, Input>;

        let usedNamespaces = namespaces ? toNamespaceList(namespaces) : [this.config.defaultNamespace];
        let usedKey = key;
        const separatorIndex = key.indexOf(':');

        if (separatorIndex > 0) {
            const namespaceFromKey = key.slice(0, separatorIndex) as Namespace;
            usedNamespaces = [namespaceFromKey];
            usedKey = key.slice(separatorIndex + 1);
        }

        const namespacesToTry = [...new Set([...usedNamespaces, this.config.defaultNamespace])];
        let result: TranslationValue | undefined;
        for (const namespace of namespacesToTry) {
            result = this.lookup(locale, namespace, usedKey);
            if (typeof result !== 'undefined') break;
        }

        const { t: format, s: strict, c: count, index, ...variables } = options ?? {};
        const interpolationVariables: Record<string, unknown> = { ...variables };

        switch (true) {
            case typeof count === 'number': {
                interpolationVariables.count ??= count;
                interpolationVariables.c ??= count;
                const pluralCategory = getPluralCategory(locale, count);

                switch (true) {
                    case isArray(result):
                        result = result[pluralCategory === 'one' ? 0 : 1];
                        break;
                    case isRecord(result):
                        result = (result[pluralCategory] ?? result.other) as TranslationValue | undefined;
                        break;
                }
                break;
            }
            case typeof index === 'number': {
                if (isArray(result) && index >= 0 && index < result.length) {
                    result = result[index];
                }
                break;
            }
        }

        if (typeof result !== 'string' && typeof result !== 'number' && typeof result !== 'boolean') {
            return (strict ? '' : key) as unknown as TranslateReturnType<Ns, Resource, Input>;
        }

        let translated = String(result);

        for (const [variable, value] of Object.entries(interpolationVariables)) {
            translated = translated.replace(new RegExp(`{{${escapeRegExp(variable)}}}`, 'g'), () =>
                String(value ?? ''),
            );
        }

        return (format ? formatText(format, translated) : translated) as unknown as TranslateReturnType<
            Ns,
            Resource,
            Input
        >;
    }

    private lookup(locale: Locale, namespace: Namespace, key: string) {
        let result: TranslationValue | undefined = this.resources.get(locale)?.get(namespace);

        for (const part of key.split('.')) {
            if (Array.isArray(result)) {
                const index = Number(part);
                if (!Number.isInteger(index) || index < 0 || index >= result.length) return undefined;
                result = result[index];
            } else if (isRecord(result) && part in result) {
                result = (result as Record<string, TranslationValue | undefined>)[part];
            } else {
                return undefined;
            }
        }

        return result;
    }

    getFixedT<Ns extends NamespaceInput<Namespace>>(lang: Locale, ns: Ns) {
        const fixedT: InternalFixedT<Ns, Resource, DefaultNS, InitialNS> = (key, opts) => {
            return this.translate(key, lang, opts, ns) as any;
        };

        return fixedT;
    }

    hasReady(locale: Locale, namespaces: NamespaceInput<Namespace>) {
        const localeResources = this.resources.get(locale);

        return toNamespaceList(namespaces).every((namespace) => localeResources?.has(namespace));
    }
    async loadNamespaces(locale: Locale, namespaces: NamespaceInput<Namespace>) {
        await Promise.all(toNamespaceList(namespaces).map((namespace) => this.loadNamespace(locale, namespace)));
    }

    private async loadNamespace(locale: Locale, namespace: Namespace) {
        if (this.resources.get(locale)?.has(namespace)) return;

        let localePromises = this.loading.get(locale);
        if (!localePromises) {
            localePromises = new Map();
            this.loading.set(locale, localePromises);
        }

        const pending = localePromises.get(namespace);
        if (pending) return pending;

        const loader = this.config.resources[locale]?.[namespace];
        if (!loader) {
            throw new Error(`No i18n resource loader configured for "${locale}:${namespace}"`);
        }

        const promise = (async () => {
            const resource = await loader();

            let localeResources = this.resources.get(locale);

            if (!localeResources) {
                localeResources = new Map();
                this.resources.set(locale, localeResources);
            }

            localeResources.set(namespace, resource);
        })();

        localePromises.set(namespace, promise);

        try {
            await promise;
        } catch (error) {
            localePromises.delete(namespace);
            throw error;
        }
    }
}
