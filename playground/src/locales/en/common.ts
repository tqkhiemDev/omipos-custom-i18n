import { TranslationResource } from "@khiemtq/i18n";

export default {
  badge: "Live huhushfgdsg",

  title: "Develop translations in real time",
  greeting: "Hello, {{name}}!",
  items: {
    one: "{{count}} item",
    other: "{{count}} items",
  },
} as const satisfies TranslationResource;
