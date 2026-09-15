import { Playground } from '../Playground';
import { getTranslation } from '../i18n-server';
import { getServerLocale } from '../server-locale';

export default async function HomePage() {
    const locale = await getServerLocale();
    const { t } = await getTranslation(locale, ['playground', 'common']);

    const abcxyz = t('common:greeting');

    return <Playground serverMessage={t('common:greeting')} />;
}
