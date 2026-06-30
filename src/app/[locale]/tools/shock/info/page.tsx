import { useLocale, useTranslations } from 'next-intl';
import {
  BREAKPOINT_MULTIPLIER,
  CC_HIGH_THRESHOLD,
  COLOR_LEVELS,
  CYA_HIGH_THRESHOLD,
  CYA_UNKNOWN_RANGE,
  DEFAULT_CALCIUM_PCT,
  DEFAULT_SODIUM_TRADE_PCT,
  FC_UNKNOWN_RANGE,
  PRODUCT_COEFFICIENTS,
  SLAM_CYA_RATIO,
} from '@/lib/calculator';
import type { ColorLevel } from '@/lib/calculator';
import { ToolInfoLayout } from '@/components/tools/shared/ToolInfoLayout';
import { InfoSection } from '@/components/tools/shared/InfoSection';
import { Formula } from '@/components/tools/shared/Formula';

const COLOR_ROWS: ColorLevel[] = ['perfect', 'light_green', 'green_brown', 'dark_green'];
const COLOR_LABEL_KEY: Record<ColorLevel, string> = {
  perfect: 'Color.perfectLabel',
  light_green: 'Color.lightGreenLabel',
  green_brown: 'Color.greenBrownLabel',
  dark_green: 'Color.darkGreenLabel',
};

const SOURCES = [
  { label: 'TroubleFreePool — Chlorine / CYA Chart', href: 'https://www.troublefreepool.com/blog/2019/01/18/chlorine-cya-chart/' },
  { label: 'TroubleFreePool — SLAM Method', href: 'https://www.troublefreepool.com/blog/2018/12/12/slam-shock-level-and-maintain/' },
  { label: 'Orenda — Breakpoint Chlorination', href: 'https://blog.orendatech.com/breakpoint-chlorination-explained' },
  { label: 'PHTA / AQUA — Sodium Hypochlorite', href: 'https://www.aquamagazine.com/retail/article/15122551/sodium-hypochlorite-aka-liquid-chlorine' },
];

export default function ShockInfoPage() {
  const t = useTranslations('Tools.Shock');
  const locale = useLocale();

  const fmt = (n: number, min = 0, max = 2) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }).format(n);

  const ratio = fmt(SLAM_CYA_RATIO, 2, 2);
  const pct = `${fmt(SLAM_CYA_RATIO * 100)}%`;
  const mult = String(BREAKPOINT_MULTIPLIER);
  const maxMult = fmt(
    Math.max(...Object.values(COLOR_LEVELS).map((c) => c.multiplier ?? 0)),
  );
  const salt = fmt(PRODUCT_COEFFICIENTS.sodium_hypochlorite.saltPerPpm);
  const hardness = fmt(PRODUCT_COEFFICIENTS.calcium_hypochlorite.hardnessPerPpm);

  const productRows = [
    {
      name: t('Result.sodiumName'),
      strength: `≈ ${fmt(DEFAULT_SODIUM_TRADE_PCT)}%`,
      adds: t('Info.product.sodiumAdds', { salt }),
    },
    {
      name: t('Result.calciumName'),
      strength: `≈ ${fmt(DEFAULT_CALCIUM_PCT)}%`,
      adds: t('Info.product.calciumAdds', { hardness }),
    },
  ];

  const th = 'border-b border-border px-3 py-2 text-left font-semibold text-foreground';
  const td = 'border-b border-border/60 px-3 py-2 align-top';

  return (
    <ToolInfoLayout title={t('Info.title')} subtitle={t('Info.subtitle')} backHref="/tools/shock">
      <InfoSection title={t('Info.overview.title')}>
        <p>{t('Info.overview.p1')}</p>
      </InfoSection>

      <InfoSection title={t('Info.chlorine.title')}>
        <p>{t('Info.chlorine.p1')}</p>
        <p>{t('Info.chlorine.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.target.title')}>
        <p>{t('Info.target.p1')}</p>
        <Formula>{t('Info.target.formula', { ratio })}</Formula>
        <p>{t('Info.target.p2', { pct })}</p>
      </InfoSection>

      <InfoSection title={t('Info.whySlam.title')}>
        <p>{t('Info.whySlam.p1')}</p>
        <p>{t('Info.whySlam.p2', { pct })}</p>
        <p>{t('Info.whySlam.p3', { cyaHigh: fmt(CYA_HIGH_THRESHOLD) })}</p>
      </InfoSection>

      <InfoSection title={t('Info.breakpoint.title')}>
        <p>{t('Info.breakpoint.p1', { mult })}</p>
        <Formula>{t('Info.breakpoint.formula', { mult })}</Formula>
        <p>{t('Info.breakpoint.p2')}</p>
        <Formula>{t('Info.breakpoint.formula2', { mult })}</Formula>
        <p>{t('Info.breakpoint.p3', { mult })}</p>
      </InfoSection>

      <InfoSection title={t('Info.color.title')}>
        <p>{t('Info.color.p1')}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>{t('Info.color.headerState')}</th>
                <th className={th}>{t('Info.color.headerMultiplier')}</th>
                <th className={th}>{t('Info.color.headerFloor')}</th>
              </tr>
            </thead>
            <tbody>
              {COLOR_ROWS.map((level) => {
                const cfg = COLOR_LEVELS[level];
                return (
                  <tr key={level}>
                    <td className={td}>{t(COLOR_LABEL_KEY[level])}</td>
                    <td className={`${td} font-mono`}>
                      {cfg.multiplier == null ? '—' : `×${fmt(cfg.multiplier)}`}
                    </td>
                    <td className={`${td} font-mono`}>
                      {cfg.floor == null ? t('Info.color.perfectNote') : `${fmt(cfg.floor)} ppm`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>{t('Info.color.p2', { maxMult, ccHigh: fmt(CC_HIGH_THRESHOLD) })}</p>
      </InfoSection>

      <InfoSection title={t('Info.dose.title')}>
        <p>{t('Info.dose.p1')}</p>
        <Formula>{t('Info.dose.formula')}</Formula>
        <p>{t('Info.dose.p2')}</p>
      </InfoSection>

      <InfoSection title={t('Info.product.title')}>
        <p>{t('Info.product.p1')}</p>
        <Formula>{t('Info.product.formulaCalcium')}</Formula>
        <Formula>{t('Info.product.formulaSodium')}</Formula>
        <p>{t('Info.product.p2')}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>{t('Info.product.headerName')}</th>
                <th className={th}>{t('Info.product.headerStrength')}</th>
                <th className={th}>{t('Info.product.headerAdds')}</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row) => (
                <tr key={row.name}>
                  <td className={td}>{row.name}</td>
                  <td className={`${td} font-mono`}>{row.strength}</td>
                  <td className={td}>{row.adds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoSection>

      <InfoSection title={t('Info.unknowns.title')}>
        <p>
          {t('Info.unknowns.p1', {
            cyaMin: fmt(CYA_UNKNOWN_RANGE.min),
            cyaMax: fmt(CYA_UNKNOWN_RANGE.max),
            fcMin: fmt(FC_UNKNOWN_RANGE.min),
            fcMax: fmt(FC_UNKNOWN_RANGE.max),
          })}
        </p>
      </InfoSection>

      <InfoSection title={t('Info.safety.title')}>
        <p>{t('Info.safety.p1')}</p>
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
