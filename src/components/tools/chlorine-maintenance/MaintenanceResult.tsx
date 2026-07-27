'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  MAINTENANCE_FC_ABSOLUTE_MIN,
  MAINTENANCE_FC_MIN_RATIO,
  MAINTENANCE_FC_TARGET_RATIO,
  type ChlorineMaintenanceResult,
  type ProductUnit,
  type RangeOrValue,
  type WarningCode,
} from '@/lib/calculator';
import { StepCard } from '@/components/tools/shock/shared/StepCard';

interface MaintenanceResultProps {
  result: ChlorineMaintenanceResult;
  /** Localized name of the selected product, for the "add X of Y" line. */
  productName: string;
}

const UNIT_KEY: Record<ProductUnit, string> = {
  g: 'Units.g',
  kg: 'Units.kg',
  mL: 'Units.mL',
  L: 'Units.L',
};

/** Warnings this tool renders, in the order they should be read. */
const WARNING_ORDER: readonly WarningCode[] = [
  'CYA_LOCK_RISK',
  'CYA_HIGH',
  'CYA_ABOVE_IDEAL',
  'CYA_UNKNOWN_ASSUMED',
  'LOW_DOSE',
];

export function MaintenanceResult({ result, productName }: MaintenanceResultProps) {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const locale = useLocale();

  const nf = (n: number, max = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: max }).format(n);

  const show = (r: RangeOrValue<string>) =>
    r.isRange ? `${nf(r.min)} - ${nf(r.max)}` : nf(r.value);

  const { target, dose, product, isAtTarget, breakdown, warnings } = result;
  const shownWarnings = WARNING_ORDER.filter((code) => warnings.includes(code));

  const minPct = nf(MAINTENANCE_FC_MIN_RATIO * 100);
  const targetPct = nf(MAINTENANCE_FC_TARGET_RATIO * 100);

  return (
    <StepCard num={6} title={t('Result.title')}>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t('Result.kicker')}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="text-4xl font-bold md:text-5xl">{show(target.targetFC)}</span>
        <span className="text-lg text-muted-foreground">ppm</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('Result.neverBelow', { min: show(target.minFC) })}
      </p>
      {target.floorApplied && (
        <p className="mt-1 text-sm text-muted-foreground">{t('Result.floorNote')}</p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        {isAtTarget ? (
          <p className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
            <span>{t('Result.atTarget')}</span>
          </p>
        ) : product ? (
          <>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t('Result.doseKicker')}
            </p>
            {/* Spelled out, not just a number: what to add, how much, of what. */}
            <p className="mt-1 text-2xl font-bold md:text-3xl">
              {t('Result.doseLine', {
                amount: show(product.amount),
                unit: t(UNIT_KEY[product.amount.unit]),
                product: productName,
              })}
            </p>
            {product.sideEffects.cyaAddedPpm > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('Result.doseAddsCya', { cya: nf(product.sideEffects.cyaAddedPpm, 2) })}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Transparent breakdown — always visible, never a black box. */}
      <div className="mt-5 space-y-1 rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
          {t('Breakdown.title')}
        </p>
        {breakdown.cyaUsed !== null ? (
          <>
            <p>
              {t('Breakdown.min', {
                cya: nf(breakdown.cyaUsed),
                pct: minPct,
                floor: nf(MAINTENANCE_FC_ABSOLUTE_MIN),
                result: show(target.minFC),
              })}
            </p>
            <p>
              {t('Breakdown.target', {
                cya: nf(breakdown.cyaUsed),
                pct: targetPct,
                result: show(target.targetFC),
              })}
            </p>
          </>
        ) : (
          <p>
            {t('Breakdown.cyaAssumed', {
              min: nf(CYA_IDEAL_RANGE.min),
              target: show(target.targetFC),
            })}
          </p>
        )}
        {dose && (
          <p>
            {breakdown.currentFCAssumed
              ? t('Breakdown.gapAssumed', {
                  target: show(target.targetFC),
                  gap: show(dose.gap),
                })
              : t('Breakdown.gap', {
                  target: show(target.targetFC),
                  current: nf(breakdown.currentFC ?? 0),
                  gap: show(dose.gap),
                })}
          </p>
        )}
        {dose && (
          <p>
            {t('Breakdown.pure', {
              volume: nf(breakdown.volumeL, 0),
              gap: show(dose.gap),
              pure: show(dose.pureChlorine),
            })}
          </p>
        )}
        {product && (
          <p>
            {t('Breakdown.product', {
              pure: show(dose?.pureChlorine ?? target.targetFC),
              amount: show(product.amount),
              unit: t(UNIT_KEY[product.amount.unit]),
            })}
          </p>
        )}
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>{t('Breakdown.note')}</span>
      </p>

      {shownWarnings.map((code) => (
        <p
          key={code}
          className="mt-3 flex items-start gap-2 rounded-md border-2 border-warning bg-warning/10 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            {t(`Warnings.${code}`, {
              idealMax: nf(CYA_IDEAL_RANGE.max),
              cyaHigh: nf(CYA_HIGH_THRESHOLD),
            })}
          </span>
        </p>
      ))}
    </StepCard>
  );
}
