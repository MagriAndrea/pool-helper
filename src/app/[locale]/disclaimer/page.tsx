import { useTranslations } from 'next-intl';
import { InfoSection } from '@/components/tools/shared/InfoSection';

const GITHUB_REPO_URL = 'https://github.com/MagriAndrea/pool-helper';

export default function DisclaimerPage() {
  const t = useTranslations('Disclaimer');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-8">
        <InfoSection title={t('sections.purpose.title')}>
          <p>{t('sections.purpose.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.scope.title')}>
          <p>{t('sections.scope.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.safety.title')}>
          <p>{t('sections.safety.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.liability.title')}>
          <p>{t('sections.liability.p1')}</p>
        </InfoSection>

        <InfoSection title={t('sections.privacy.title')}>
          <p>{t('sections.privacy.p1')}</p>
          <p>
            {t('sections.privacy.p2')}{' '}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {t('sections.privacy.githubLinkLabel')}
            </a>
          </p>
        </InfoSection>

        <InfoSection title={t('sections.affiliate.title')}>
          <p>{t('sections.affiliate.p1')}</p>
        </InfoSection>
      </div>
    </div>
  );
}
