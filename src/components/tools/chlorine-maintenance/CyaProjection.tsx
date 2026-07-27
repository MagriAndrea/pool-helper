'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  CYA_IDEAL_RANGE,
  DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH,
  type CyaProjectionResult,
} from '@/lib/calculator';
import { cn } from '@/lib/utils';

interface CyaProjectionProps {
  projection: CyaProjectionResult | null;
}

const TREND_ICON = {
  rising: TrendingUp,
  falling: TrendingDown,
  stable: Minus,
} as const;

export function CyaProjection({ projection }: CyaProjectionProps) {
  const t = useTranslations('Tools.ChlorineMaintenance.Projection');
  const locale = useLocale();

  const nf = (n: number, max = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: max }).format(n);

  // No projection without a measured CYA: the tool says why rather than
  // silently hiding the section.
  if (!projection) {
    return (
      <section className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
        <h2 className="mb-1 text-base font-semibold text-foreground">{t('title')}</h2>
        <p>{t('needsCya')}</p>
      </section>
    );
  }

  const { trend, netPpmPerWeek, addedPpmPerWeek, degradedPpmPerWeek, weeksToCeiling, points } =
    projection;
  const TrendIcon = TREND_ICON[trend];
  const isRising = trend === 'rising';

  // Only a few rows: a 12-week table is noise, the shape is the message.
  const milestones = points.filter((p) => p.week % 4 === 0);

  return (
    <section
      className={cn(
        'rounded-xl border-2 p-5 md:p-6',
        isRising ? 'border-warning bg-warning/5' : 'border-border bg-card',
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <TrendIcon
          className={cn('mt-0.5 size-5 shrink-0', isRising ? 'text-warning' : 'text-muted-foreground')}
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(`trend.${trend}`)}</p>
        </div>
      </div>

      {isRising && weeksToCeiling !== null && (
        <p className="text-base">
          {t('weeksToCeiling', {
            weeks: nf(weeksToCeiling),
            ceiling: nf(CYA_IDEAL_RANGE.max),
          })}
        </p>
      )}
      {!isRising && <p className="text-base">{t('noCeiling')}</p>}

      <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
          {t('breakdownTitle')}
        </p>
        <p>{t('breakdownAdded', { added: nf(addedPpmPerWeek) })}</p>
        <p>
          {t('breakdownDegraded', {
            degraded: nf(degradedPpmPerWeek),
            monthly: nf(DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH),
          })}
        </p>
        <p>{t('breakdownNet', { net: nf(netPpmPerWeek) })}</p>
      </div>

      {isRising && milestones.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">
                  {t('headerWeek')}
                </th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">
                  {t('headerCya')}
                </th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((point) => (
                <tr key={point.week}>
                  <td className="border-b border-border/60 px-3 py-2">
                    {t('weekLabel', { week: point.week })}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono">
                    {nf(point.cyaPpm)} ppm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">{t('assumption')}</p>
    </section>
  );
}
