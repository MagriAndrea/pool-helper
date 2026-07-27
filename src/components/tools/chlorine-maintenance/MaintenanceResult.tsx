'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Droplets } from 'lucide-react';
import {
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  type ChlorineMaintenanceResult,
  type RangeOrValue,
  type WarningCode,
} from '@/lib/calculator';

interface MaintenanceResultProps {
  result: ChlorineMaintenanceResult | null;
}

/** Warnings this tool renders, in the order they should be read. */
const WARNING_ORDER: readonly WarningCode[] = [
  'CYA_LOCK_RISK',
  'CYA_HIGH',
  'CYA_ABOVE_IDEAL',
  'CYA_UNKNOWN_ASSUMED',
  'LOW_DOSE',
];

export function MaintenanceResult({ result }: MaintenanceResultProps) {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const locale = useLocale();

  const nf = (n: number, max = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: max }).format(n);

  const showRange = (r: RangeOrValue<string>) =>
    r.isRange ? `${nf(r.min)} - ${nf(r.max)}` : nf(r.value);

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <Droplets className="mx-auto mb-2 size-8 opacity-50" />
        <p>{t('Result.prompt')}</p>
      </div>
    );
  }

  const { target, product, isAtTarget, warnings } = result;
  const shownWarnings = WARNING_ORDER.filter((code) => warnings.includes(code));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border-2 border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t('Result.kicker')}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <span className="text-4xl font-bold md:text-5xl">{showRange(target.targetFC)}</span>
          <span className="text-lg text-muted-foreground">ppm</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Result.neverBelow', { min: showRange(target.minFC) })}
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
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="text-3xl font-bold">{showRange(product.amount)}</span>
                <span className="text-lg text-muted-foreground">{product.amount.unit}</span>
              </div>
              {product.sideEffects.cyaAddedPpm > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('Result.doseAddsCya', { cya: nf(product.sideEffects.cyaAddedPpm, 2) })}
                </p>
              )}
            </>
          ) : null}
        </div>
      </section>

      {shownWarnings.map((code) => (
        <p
          key={code}
          className="flex items-start gap-2 rounded-md border-2 border-warning bg-warning/10 p-3 text-sm"
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
    </div>
  );
}
