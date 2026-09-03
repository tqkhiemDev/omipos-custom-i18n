import type { TranslateReturnType, ResourceLoaders } from './src/i18n/types';

type TestResource = {
  en: {
    common: () => Promise<{
      title: string;
      greeting: string;
    }>;
    playground: () => Promise<{
      badge: string;
    }>;
  };
  vi: {
    common: () => Promise<{
      title: string;
      greeting: string;
    }>;
    playground: () => Promise<{
      badge: string;
    }>;
  };
};

// Test case 1: Single namespace
type Test1 = TranslateReturnType<'common', TestResource, 'title'>;

// Test case 2: Multiple namespaces as array
type Test2 = TranslateReturnType<['common', 'playground'], TestResource, 'title'>;

// Test case 3: With namespace prefix
type Test3 = TranslateReturnType<['common', 'playground'], TestResource, 'common:title'>;

// Check what these resolve to
const test1: Test1 = '' as any;
const test2: Test2 = '' as any;
const test3: Test3 = '' as any;
