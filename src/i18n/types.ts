export type FormatTextType = 'lf' | 'l' | 'u' | 'c' | 'ca';

export type TranslateKey = string; // 'namespace:key' | 'key'
/**
 * Options for translation lookup and formatting.
 *
 * **All keys except reserved ones** become interpolation variables, replacing `{{key}}` placeholders in translation.
 *
 * @example
 * ```ts
 * t('greeting', { name: 'Alice' }) // "Hello, {{name}}" → "Hello, Alice"
 * t('items', { c: 5, count: 5 }) // pluralization + interpolation
 * t('list', { index: 0 }) // pick first element from array
 * t('missing', { s: true }) // throw if "missing" not found
 * t('title', { t: 'u' }) // 'u' = uppercase format
 * ```
 */
export type TranslateOptions = {
    /** Text formatting function applied to final translated string */
    t?: FormatTextType;
    /** Strict mode; throw if key missing (overrides instance default) */
    s?: boolean;
    /** Count for pluralization (passed to `Intl.PluralRules`) */
    c?: number;
    /** Index for array-type translations */
    index?: number;
} & { [variable: string]: any };
export type Translator = (key: TranslateKey, opts?: TranslateOptions) => string;

export type JoinTranslatorArg = TranslateKey | readonly [TranslateKey, TranslateOptions];

export type JoinTranslator = (...args: JoinTranslatorArg[]) => string;
export type NamespaceInput<Namespace extends string> = Namespace | readonly Namespace[];

export type TranslationValue =
    | string
    | number
    | boolean
    | null
    | TranslationResource
    | readonly TranslationValue[]
    | {
          readonly [K in Intl.LDMLPluralRule]: TranslationValue;
      };

export type TranslationResource = {
    readonly [key: string]: TranslationValue;
};

export type ResourceLoader = () => TranslationResource | Promise<TranslationResource>;

export type I18nConfig<
    Locale extends string,
    Namespace extends string,
    Resource extends ResourceLoaders<NoInfer<Locale>, NoInfer<Namespace>>,
    DefaultNS extends Namespace = Namespace,
    InitialNS extends readonly Namespace[] = readonly Namespace[],
> = {
    readonly namespaces: readonly Namespace[];
    readonly locales: readonly Locale[];
    readonly defaultLocale: Locale;
    readonly defaultNamespace: DefaultNS;
    readonly initialNamespaces?: InitialNS;
    readonly resources: Resource;
};

export type DefaultNamespaces<Config extends I18nConfig<any, any, any, any, any>> =
    Config extends I18nConfig<any, any, any, infer DefaultNS, infer InitialNS>
        ? InitialNS extends readonly any[]
            ? readonly [DefaultNS, ...InitialNS]
            : readonly [DefaultNS]
        : never;

export type ResourceLoaders<Locale extends string, Namespace extends string> = {
    readonly [locale in Locale]: {
        readonly [namespace in Namespace]: ResourceLoader;
    };
};

type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

type LoadedResource<
    Namespaces extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
> = Prettify<Awaited<ReturnType<Resource[keyof Resource][ToNSArr<Namespaces>[number]]>>>;

type TranslationKeys<T> = T extends readonly unknown[]
    ? never
    : KnownResource<T> extends infer R
      ? R extends object
          ? {
                [K in keyof R & string]: R[K] extends readonly unknown[]
                    ? K
                    : KnownResource<R[K]> extends infer Child
                      ? [Child] extends [never]
                          ? K
                          : Child extends object
                            ? K | `${K}.${TranslationKeys<Child>}`
                            : K
                      : never;
            }[keyof R & string]
          : never
      : never;
type ToNSArr<T extends NamespaceInput<string>> = T extends string ? [T] : T;

type KnownResource<T> = T extends readonly unknown[]
    ? never
    : T extends unknown
      ? string extends keyof T
          ? never
          : T
      : never;

type ExtractValueFromUnion<T, K extends string> = T extends any
    ? K extends keyof T
        ? T[K]
        : K extends `${infer Head}.${infer Tail}`
          ? Head extends keyof T
              ? ExtractValueFromUnion<T[Head], Tail>
              : never
          : never
    : never;

type TranslationValueByKey<T, K extends string> =
    ExtractValueFromUnion<T, K> extends infer Result
        ? [Result] extends [never]
            ? string
            : Exclude<Result, never> extends never
              ? string
              : Exclude<Result, never>
        : string;

type GetNamespaceResource<Namespace extends string, Resource extends ResourceLoaders<string, string>> = Awaited<
    ReturnType<Resource[keyof Resource][Namespace & keyof Resource[keyof Resource]]>
>;

type LiteralUnion<T extends string> = T | (string & {});
type OnlyStringKeys<T> = T extends string ? T : string;

type AllNamespaceKeys<Namespaces extends NamespaceInput<string>, Resource extends ResourceLoaders<string, string>> = {
    [Namespace in ToNSArr<Namespaces>[number]]: `${Namespace & string}:${TranslationKeys<
        Prettify<Awaited<ReturnType<Resource[keyof Resource][Namespace]>>>
    >}`;
}[ToNSArr<Namespaces>[number]];

export type TranslateKeyWithNamespace<
    Namespaces extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
> = LiteralUnion<
    TranslationKeys<Prettify<LoadedResource<Namespaces, Resource>>> | AllNamespaceKeys<Namespaces, Resource>
>;

type _TranslateReturnTypeCompute<
    Namespaces extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
    Input extends TranslateKeyWithNamespace<Namespaces, Resource>,
> = OnlyStringKeys<
    Input extends `${infer NS}:${infer Key}`
        ? NS extends ToNSArr<Namespaces>[number]
            ? TranslationValueByKey<GetNamespaceResource<NS, Resource>, Key>
            : string
        : ToNSArr<Namespaces> extends readonly [infer SingleNS extends string]
          ? TranslationValueByKey<GetNamespaceResource<SingleNS, Resource>, Input>
          : TranslationValueByKey<
                {
                    [NS in ToNSArr<Namespaces>[number]]: GetNamespaceResource<NS, Resource>;
                }[ToNSArr<Namespaces>[number]],
                Input
            >
>;

export type TranslateReturnType<
    Namespaces extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
    Input extends TranslateKeyWithNamespace<Namespaces, Resource>,
> = _TranslateReturnTypeCompute<Namespaces, Resource, Input> extends infer R ? R & {} : never;

export type InternalFixedT<
    Ns extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
    DefaultNS extends string = string,
    InitialNS extends readonly string[] = readonly string[],
> = <K extends TranslateKeyWithNamespace<readonly [...ToNSArr<Ns>, DefaultNS, ...InitialNS], Resource>>(
    key: K,
    opts?: TranslateOptions,
) => TranslateReturnType<readonly [...ToNSArr<Ns>, DefaultNS, ...InitialNS], Resource, K>;
