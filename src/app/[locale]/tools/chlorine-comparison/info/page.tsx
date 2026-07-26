import { useLocale, useTranslations } from 'next-intl';
import { DEFAULT_SODIUM_DENSITY } from '@/lib/calculator';
import { ToolInfoLayout } from '@/components/tools/shared/ToolInfoLayout';
import { InfoSection } from '@/components/tools/shared/InfoSection';
import { Formula } from '@/components/tools/shared/Formula';

export default function ChlorineComparisonInfoPage() {
  const t = useTranslations('Tools.ChlorineComparison');
  const locale = useLocale();

  const fmt = (n: number, min = 0, max = 2) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(n);

  const density = fmt(DEFAULT_SODIUM_DENSITY, 1, 1);

  return (
    <ToolInfoLayout title={t('Info.title')} subtitle={t('Info.subtitle')} backHref="/tools/chlorine-comparison">
      <InfoSection title={t('Info.overview.title')}>
        <p>{t('Info.overview.p1')}</p>
      </InfoSection>

      <InfoSection title={t('Info.activeChlorine.title')}>
        <p>{t('Info.activeChlorine.p1')}</p>
        <Formula>{t('Info.activeChlorine.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.calcium.title')}>
        <p>{t('Info.calcium.p1')}</p>
        <Formula>{t('Info.calcium.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.sodium.title')}>
        <p>{t('Info.sodium.p1', { density })}</p>
        <Formula>{t('Info.sodium.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.verdict.title')}>
        <p>{t('Info.verdict.p1')}</p>
      </InfoSection>

      <InfoSection title={t('Info.limits.title')}>
        <p>{t('Info.limits.p1')}</p>
      </InfoSection>
    </ToolInfoLayout>
  );
}
