import { useLocale, useTranslations } from 'next-intl';
import { LITERS_PER_GALLON, METERS_PER_FOOT } from '@/lib/calculator';
import { ToolInfoLayout } from '@/components/tools/shared/ToolInfoLayout';
import { InfoSection } from '@/components/tools/shared/InfoSection';
import { Formula } from '@/components/tools/shared/Formula';

export default function PoolVolumeInfoPage() {
  const t = useTranslations('Tools.PoolVolume');
  const locale = useLocale();

  const fmt = (n: number, min = 0, max = 2) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(n);

  const meters = fmt(METERS_PER_FOOT, 4, 4);
  const gal = fmt(LITERS_PER_GALLON, 4, 5);

  return (
    <ToolInfoLayout title={t('Info.title')} subtitle={t('Info.subtitle')} backHref="/tools/pool-volume">
      <InfoSection title={t('Info.overview.title')}>
        <p>{t('Info.overview.p1')}</p>
      </InfoSection>

      <InfoSection title={t('Info.rectangle.title')}>
        <p>{t('Info.rectangle.p1')}</p>
        <Formula>{t('Info.rectangle.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.circle.title')}>
        <p>{t('Info.circle.p1')}</p>
        <Formula>{t('Info.circle.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.depth.title')}>
        <p>{t('Info.depth.p1')}</p>
      </InfoSection>

      <InfoSection title={t('Info.units.title')}>
        <p>{t('Info.units.p1')}</p>
        <Formula>{t('Info.units.formula', { meters, gal })}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.limits.title')}>
        <p>{t('Info.limits.p1')}</p>
      </InfoSection>
    </ToolInfoLayout>
  );
}
