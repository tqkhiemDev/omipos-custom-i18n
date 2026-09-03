import { TranslationResource } from "@khiemtq/i18n";

export default {
  badge: "Live source mode",
  switchLanguage: "Switch to",
  savingLanguage: "Saving language…",
  description:
    "This app imports the package source directly. Edit src/i18n or these locale files and Vite will refresh the result.",
  nameLabel: "Name",
  countLabel: "Count",
  joined: "Translations can be composed.",
  sourceHint: "Loaded from the common and playground namespaces.",
  serverReady: "This sentence was translated in a React Server Component.",
} as const satisfies TranslationResource;
