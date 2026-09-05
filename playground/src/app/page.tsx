import { Playground } from '../Playground';
import { getTranslation } from '../i18n-server';
import { getServerLocale } from '../server-locale';

export default async function HomePage() {
    const locale = await getServerLocale();
    const { t } = await getTranslation(locale);

    const abcxyz = t('weekdays');

    return <Playground serverMessage={t('items.other')} />;
}
