import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('Footer');
  const tApp = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="container mx-auto flex max-w-screen-2xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between md:px-8">
        <div className="text-center md:text-left">
          <p className="font-mono font-semibold text-foreground">{tApp('AppName')}</p>
          <p>{t('tagline')}</p>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/about" className="transition-colors hover:text-foreground">
            {t('about')}
          </Link>
          <Link href="/disclaimer" className="transition-colors hover:text-foreground">
            {t('disclaimer')}
          </Link>
          <Link href="/docs/api" className="transition-colors hover:text-foreground">
            {t('apiDocs')}
          </Link>
        </nav>

        <p>{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
