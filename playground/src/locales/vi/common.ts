import { TranslationResource } from "@khiemtq/i18n";

export default {
  title: "Phát triển bản dịch theo thời gian thực",
  greeting: "Xin chào, {{name}}!",
  items: {
    other: "{{count}} mục",
  },
} as const satisfies TranslationResource;
