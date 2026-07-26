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

      <InfoSection title={t('Info.slots.title')}>
        <p>{t('Info.slots.p1')}</p>
        <p>{t('Info.slots.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.activeChlorine.title')}>
        <p>{t('Info.activeChlorine.p1')}</p>
        <Formula>{t('Info.activeChlorine.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.solid.title')}>
        <p>{t('Info.solid.p1')}</p>
        <Formula>{t('Info.solid.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.liquid.title')}>
        <p>{t('Info.liquid.p1', { density })}</p>
        <Formula>{t('Info.liquid.formula')}</Formula>
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
