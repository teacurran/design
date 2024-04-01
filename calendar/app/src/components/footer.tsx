import { useLocale } from '~/utils/use-locale'
import Link from 'next/link'
import { type ReactElement } from 'react'

export function InfoFooter (props: { filter: string, locales: string[] }): ReactElement<any, any> {
  const { t, i18n } = useLocale()

  return (
    <footer className="info">
      <p>{t('footer.double_click_to_edit')}</p>
      {/* Change this out with your name and url ↓ */}
      <p>
        {t('footer.created_with')} <a href="http://trpc.io">tRPC</a>{' '}
        {t('footer.by')}{' '}
        <a href="https://twitter.com/alexdotjs">alexdotjs / KATT</a>.
      </p>
      <p>
        <a href="https://github.com/trpc/examples-next-prisma-todomvc">
          {t('footer.source_code')}
        </a>{' '}
      </p>
      <p>
        {t('footer.based_on')} <a href="http://todomvc.com">TodoMVC</a>,{' '}
        {t('footer.template_made_by')}{' '}
        <a href="http://sindresorhus.com">Sindre Sorhus</a>.
      </p>
      <ul className="filters">
        {t('footer.select_language')}
        {props.locales.map((changeTo) => (
          <li key={changeTo}>
            <Link
              href={`/${props.filter}`}
              locale={changeTo}
              className={changeTo === i18n.language ? 'selected' : ''}
            >
              {changeTo}
            </Link>
          </li>
        ))}
      </ul>
    </footer>
  )
}
