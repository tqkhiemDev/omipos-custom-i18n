import { TranslationResource } from '@omipos/i18n';

export default {
    badge: 'Live huhushfgdsg',
    greeting: 'Hello, {{name}}!',
    items: {
        one: '{{count}} item',
        other: '{{count}} items',
    },
    title: 'Develop translations in real time',
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
} as const satisfies TranslationResource;
