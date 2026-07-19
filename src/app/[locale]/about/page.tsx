import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { InfoSection } from '@/components/tools/shared/InfoSection';

export default function AboutPage() {
  const t = useTranslations('About');
  const tDisclaimer = useTranslations('Disclaimer');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-8">
        <InfoSection title={t('sections.what.title')}>
          <p>{t('sections.what.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.sources.title')}>
          <p>{t('sections.sources.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.why.title')}>
          <p>{t('sections.why.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.howItsBuilt.title')}>
          <p>{t('sections.howItsBuilt.p1')}</p>
        </InfoSection>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        {t('disclaimerCallout')}{' '}
        <Link href="/disclaimer" className="text-primary underline underline-offset-2">
          {tDisclaimer('title')}
        </Link>
      </p>
    </div>
  );
}
