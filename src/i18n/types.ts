export type FormatTextType = 'lf' | 'l' | 'u' | 'c' | 'ca';

export type TranslateKey = string; // 'namespace:key' | 'key'
export type TranslateOptions = {
    t?: FormatTextType;
    s?: boolean; // strict, return empty string if not found
    c?: number; // count, return plurals version of the text
    index?: number; // when the resolved value is an array, return the item at this index
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

export type TranslateReturnType<
    Namespaces extends NamespaceInput<string>,
    Resource extends ResourceLoaders<string, string>,
    Input extends TranslateKeyWithNamespace<Namespaces, Resource>,
> = OnlyStringKeys<
    Input extends `${infer NS}:${infer Key}`
        ? NS extends ToNSArr<Namespaces>[number]
            ? TranslationValueByKey<Prettify<GetNamespaceResource<NS, Resource>>, Key>
            : string
        : ToNSArr<Namespaces> extends readonly [infer SingleNS extends string]
          ? TranslationValueByKey<Prettify<GetNamespaceResource<SingleNS, Resource>>, Input>
          : TranslationValueByKey<
                Prettify<
                    {
                        [NS in ToNSArr<Namespaces>[number]]: GetNamespaceResource<NS, Resource>;
                    }[ToNSArr<Namespaces>[number]]
                >,
                Input
            >
>;

export type InternalFixedT<Ns extends NamespaceInput<string>, Resource extends ResourceLoaders<string, string>> = <
    K extends TranslateKeyWithNamespace<Ns, Resource>,
>(
    key: K,
    opts?: TranslateOptions,
) => TranslateReturnType<Ns, Resource, K>;
