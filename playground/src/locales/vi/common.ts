import { TranslationResource } from '@khiemtq/i18n';

export default {
    greeting: 'Xin chào, {{name}}!',
    items: {
        other: '{{count}} mục',
    },
    title: 'Phát triển bản dịch theo thời gian thực',
    weekdays: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
} as const satisfies TranslationResource;
