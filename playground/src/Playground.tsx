'use client';

import { useState, useTransition } from 'react';

import { setLocaleCookie } from './app/actions';
import { useTranslation } from './i18n-client';
import { type Locale } from './i18n-config';

type PlaygroundProps = {
    serverMessage: string;
};

export function Playground({ serverMessage }: PlaygroundProps) {
    const { i18n, j, langue, ready, t } = useTranslation('playground');
    const [name, setName] = useState('Khiem');
    const [count, setCount] = useState(2);
    const [isChangingLocale, startLocaleTransition] = useTransition();

    const nextLocale: Locale = langue === 'vi' ? 'en' : 'vi';

    const changeLocale = () => {
        startLocaleTransition(async () => {
            await setLocaleCookie(nextLocale);
            await i18n.changeLanguage(nextLocale);
        });
    };

    return (
        <main className='shell'>
            <section className='hero'>
                <div className='eyebrow'>
                    <span
                        className='status-dot'
                        aria-hidden='true'
                    />
                    {t('badge')}
                </div>

                <div className='hero__heading'>
                    <div>
                        <p className='package-name'>@omipos/i18n · Next.js 16</p>
                        <h1>{t('common:title')}</h1>
                    </div>

                    <button
                        className='language-button'
                        disabled={isChangingLocale}
                        type='button'
                        onClick={changeLocale}
                    >
                        {isChangingLocale
                            ? t('playground:savingLanguage')
                            : `${t('playground:switchLanguage')}: ${nextLocale.toUpperCase()}`}
                    </button>
                </div>

                <p className='lead'>{t('playground:description')}</p>
                <p className='server-message'>
                    <span>RSC</span>
                    {serverMessage}
                </p>
            </section>

            <section
                className='grid'
                aria-label='Translation examples'
            >
                <article className='card card--wide'>
                    <span className='card__label'>Interpolation</span>
                    <p className='translation-output'>{t('common:greeting', { name: name || '…' })}</p>
                    <label>
                        {t('playground:nameLabel')}
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder='Khiem'
                        />
                    </label>
                </article>

                <article className='card'>
                    <span className='card__label'>Plural rules</span>
                    <p className='translation-output'>{t('common:items', { c: count })}</p>
                    <label>
                        {t('playground:countLabel')}
                        <input
                            type='number'
                            min='0'
                            value={count}
                            onChange={(event) => setCount(Number(event.target.value))}
                        />
                    </label>
                </article>

                <article className='card'>
                    <span className='card__label'>joinTranslations</span>
                    <p className='translation-output translation-output--small'>
                        {j(['common:greeting', { name: name || '…' }], 'playground:joined')}
                    </p>
                    <p className='hint'>{t('sourceHint')}</p>
                </article>
            </section>
        </main>
    );
}
