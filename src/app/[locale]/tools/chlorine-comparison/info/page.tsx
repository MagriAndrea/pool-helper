import { useLocale, useTranslations } from 'next-intl';
import {
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  DEFAULT_SODIUM_DENSITY,
  isStabilizedProduct,
  PRODUCT_COEFFICIENTS,
  PRODUCT_IDS,
  PRODUCT_RETAIL_FORMS,
} from '@/lib/calculator';
import { ToolInfoLayout } from '@/components/tools/shared/ToolInfoLayout';
import { InfoSection } from '@/components/tools/shared/InfoSection';
import { Formula } from '@/components/tools/shared/Formula';

export default function ChlorineComparisonInfoPage() {
  const t = useTranslations('Tools.ChlorineComparison');
  const tProducts = useTranslations('Products');
  const locale = useLocale();

  const fmt = (n: number, min = 0, max = 2) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(n);

  const density = fmt(DEFAULT_SODIUM_DENSITY, 1, 1);

  // Built from the model, not written out by hand: adding a product to
  // `PRODUCT_IDS` updates this page on its own. The previous wording named
  // calcium and sodium hypochlorite explicitly and went stale the moment
  // trichlor and dichlor joined the picker.
  const productRows = PRODUCT_IDS.map((productId) => ({
    productId,
    name: tProducts(productId),
    form: t(
      PRODUCT_RETAIL_FORMS[productId].form === 'liquid' ? 'Info.table.liquid' : 'Info.table.solid',
    ),
    strength: `≈ ${fmt(PRODUCT_RETAIL_FORMS[productId].typicalConcentrationPct)}%`,
    cya: isStabilizedProduct(productId)
      ? t('Info.table.cyaAdded', { cya: fmt(PRODUCT_COEFFICIENTS[productId].cyaPerPpm, 1, 1) })
      : t('Info.table.cyaNone'),
  }));

  const th = 'border-b border-border px-3 py-2 text-left font-semibold text-foreground';
  const td = 'border-b border-border/60 px-3 py-2 align-top';

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

      <InfoSection title={t('Info.table.title')}>
        <p>{t('Info.table.p1')}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>{t('Info.table.headerProduct')}</th>
                <th className={th}>{t('Info.table.headerForm')}</th>
                <th className={th}>{t('Info.table.headerStrength')}</th>
                <th className={th}>{t('Info.table.headerCya')}</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row) => (
                <tr key={row.productId}>
                  <td className={td}>{row.name}</td>
                  <td className={td}>{row.form}</td>
                  <td className={`${td} font-mono`}>{row.strength}</td>
                  <td className={`${td} font-mono`}>{row.cya}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{t('Info.table.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.solid.title')}>
        <p>{t('Info.solid.p1')}</p>
        <Formula>{t('Info.solid.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.liquid.title')}>
        <p>{t('Info.liquid.p1', { density })}</p>
        <Formula>{t('Info.liquid.formula')}</Formula>
      </InfoSection>

      <InfoSection title={t('Info.stabilized.title')}>
        <p>{t('Info.stabilized.p1')}</p>
        <p>
          {t('Info.stabilized.p2', {
            trichlor: fmt(PRODUCT_COEFFICIENTS.trichlor.cyaPerPpm, 1, 1),
            dichlor: fmt(PRODUCT_COEFFICIENTS.dichlor.cyaPerPpm, 1, 1),
            idealMax: fmt(CYA_IDEAL_RANGE.max),
            cyaHigh: fmt(CYA_HIGH_THRESHOLD),
          })}
        </p>
        <p>{t('Info.stabilized.p3')}</p>
      </InfoSection>

      <InfoSection title={t('Info.verdict.title')}>
        <p>{t('Info.verdict.p1')}</p>
        <p>{t('Info.verdict.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.limits.title')}>
        <p>{t('Info.limits.p1')}</p>
      </InfoSection>
    </ToolInfoLayout>
  );
}
