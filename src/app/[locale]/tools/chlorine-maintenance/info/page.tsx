import { useLocale, useTranslations } from 'next-intl';
import {
  CYA_DEGRADATION_RANGE_PPM_PER_MONTH,
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  DAILY_FC_DEMAND_RANGE_PPM,
  DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH,
  DEFAULT_DAILY_FC_PPM,
  MAINTENANCE_FC_ABSOLUTE_MIN,
  MAINTENANCE_FC_MIN_RATIO,
  MAINTENANCE_FC_TARGET_RATIO,
  PRODUCT_COEFFICIENTS,
} from '@/lib/calculator';
import { ToolInfoLayout } from '@/components/tools/shared/ToolInfoLayout';
import { InfoSection } from '@/components/tools/shared/InfoSection';
import { Formula } from '@/components/tools/shared/Formula';

/** Primary sources, each opened and read rather than cited second-hand. */
const SOURCES = [
  {
    label: 'TroubleFreePool — CYA / Chlorine Relationship (the FC/CYA table)',
    href: 'https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship',
  },
  {
    label: 'TroubleFreePool — Cyanuric Acid (CYA levels, loss and degradation)',
    href: 'https://www.troublefreepool.com/wiki/index.php?title=CYA',
  },
  {
    label: 'Orenda — Chlorine, pH and Cyanuric Acid Relationships',
    href: 'https://blog.orendatech.com/chlorine-ph-and-cya-relationships',
  },
  {
    label: 'CDC — Healthy Swimming: pool water treatment and testing',
    href: 'https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html',
  },
];

export default function ChlorineMaintenanceInfoPage() {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const locale = useLocale();

  const fmt = (n: number, min = 0, max = 2) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(n);

  const minPct = `${fmt(MAINTENANCE_FC_MIN_RATIO * 100, 1, 1)}%`;
  const targetPct = `${fmt(MAINTENANCE_FC_TARGET_RATIO * 100, 1, 1)}%`;
  const floor = fmt(MAINTENANCE_FC_ABSOLUTE_MIN);
  const idealMin = fmt(CYA_IDEAL_RANGE.min);
  const idealMax = fmt(CYA_IDEAL_RANGE.max);
  const cyaHigh = fmt(CYA_HIGH_THRESHOLD);
  const trichlor = fmt(PRODUCT_COEFFICIENTS.trichlor.cyaPerPpm, 1, 1);
  const dichlor = fmt(PRODUCT_COEFFICIENTS.dichlor.cyaPerPpm, 1, 1);

  // The headline number of the whole tool, derived rather than typed in: at the
  // default demand, a month of dichlor against a month of degradation.
  const dichlorPerMonth = fmt(DEFAULT_DAILY_FC_PPM * PRODUCT_COEFFICIENTS.dichlor.cyaPerPpm * 30);

  return (
    <ToolInfoLayout
      title={t('Info.title')}
      subtitle={t('Info.subtitle')}
      backHref="/tools/chlorine-maintenance"
    >
      <InfoSection title={t('Info.overview.title')}>
        <p>{t('Info.overview.p1')}</p>
        <p>{t('Info.overview.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.ratio.title')}>
        <p>{t('Info.ratio.p1')}</p>
        <Formula>{t('Info.ratio.formulaMin', { pct: minPct, floor })}</Formula>
        <Formula>{t('Info.ratio.formulaTarget', { pct: targetPct })}</Formula>
        <p>{t('Info.ratio.p2', { floor })}</p>
      </InfoSection>

      <InfoSection title={t('Info.classicRule.title')}>
        <p>{t('Info.classicRule.p1')}</p>
        <p>{t('Info.classicRule.p2', { cyaHigh, pct: minPct })}</p>
      </InfoSection>

      <InfoSection title={t('Info.lock.title')}>
        <p>{t('Info.lock.p1')}</p>
        <p>{t('Info.lock.p2')}</p>
        <p>{t('Info.lock.p3')}</p>
      </InfoSection>

      <InfoSection title={t('Info.stabilized.title')}>
        <p>{t('Info.stabilized.p1', { trichlor, dichlor })}</p>
        <p>
          {t('Info.stabilized.p2', {
            idealMin,
            idealMax,
            cyaHigh,
          })}
        </p>
        <p>{t('Info.stabilized.p3')}</p>
      </InfoSection>

      <InfoSection title={t('Info.projection.title')}>
        <p>{t('Info.projection.p1')}</p>
        <Formula>{t('Info.projection.formula')}</Formula>
        <p>
          {t('Info.projection.p2', {
            degMin: fmt(CYA_DEGRADATION_RANGE_PPM_PER_MONTH.min),
            degMax: fmt(CYA_DEGRADATION_RANGE_PPM_PER_MONTH.max),
            degUsed: fmt(DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH),
          })}
        </p>
        <p>{t('Info.projection.p3', { perMonth: dichlorPerMonth })}</p>
        <p>{t('Info.projection.p4')}</p>
      </InfoSection>

      <InfoSection title={t('Info.demand.title')}>
        <p>
          {t('Info.demand.p1', {
            min: fmt(DAILY_FC_DEMAND_RANGE_PPM.min),
            max: fmt(DAILY_FC_DEMAND_RANGE_PPM.max),
            def: fmt(DEFAULT_DAILY_FC_PPM),
          })}
        </p>
        <p>{t('Info.demand.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.limits.title')}>
        <p>{t('Info.limits.p1')}</p>
        <p>{t('Info.limits.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.sources.title')}>
        <p>{t('Info.sources.p1')}</p>
        <ul className="list-inside list-disc space-y-1">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </InfoSection>
    </ToolInfoLayout>
  );
}
