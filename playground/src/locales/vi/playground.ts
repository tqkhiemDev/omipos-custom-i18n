import { TranslationResource } from "@khiemtq/i18n";

export default {
  badge: "Đang dùng source local",
  switchLanguage: "Chuyển sang",
  savingLanguage: "Đang lưu ngôn ngữ…",
  description:
    "Ứng dụng import trực tiếp source của package. Sửa src/i18n hoặc các file locale này, Vite sẽ cập nhật kết quả.",
  nameLabel: "Tên",
  countLabel: "Số lượng",
  joined: "Các bản dịch có thể được ghép lại.",
  sourceHint: "Được tải từ namespace common và playground.",
  serverReady: "Câu này được dịch trong React Server Component.",
} as const satisfies TranslationResource;
