'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Check, RotateCcw } from 'lucide-react';
import { METERS_PER_FOOT } from '@/lib/calculator';
import type { LengthUnit, PoolShape } from '@/lib/calculator';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/tools/shock/shared/NumberInput';
import { usePoolVolume } from '@/hooks/use-pool-volume';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

function Segmented<T extends string>({ value, options, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-md border border-border"
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            i < options.length - 1 && 'border-r border-border',
            value === o.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface PoolVolumeCalculatorProps {
  /** When provided (e.g. inside the Shock modal), shows an "Apply" button. */
  onApply?: (volumeL: number) => void;
}

/**
 * Self-contained pool-volume calculator. Reused both as the standalone tool
 * page and inside the Shock tool's modal. Persists inputs to `ph_tool_volume`
 * and publishes the computed volume to the shared `ph_pool_volume` profile.
 */
export function PoolVolumeCalculator({ onApply }: PoolVolumeCalculatorProps) {
  const t = useTranslations('Tools.PoolVolume');
  const locale = useLocale();
  const { state, setState, reset, result } = usePoolVolume();

  const nf = (n: number, maxFrac = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: maxFrac }).format(n);

  const set = (patch: Partial<typeof state>) => setState((prev) => ({ ...prev, ...patch }));

  const setUnit = (next: LengthUnit) => {
    if (next === state.unit) return;
    const factor = next === 'ft' ? 1 / METERS_PER_FOOT : METERS_PER_FOOT;
    const conv = (v: number | null) =>
      v == null ? null : Math.round(v * factor * 100) / 100;
    set({
      unit: next,
      length: conv(state.length),
      width: conv(state.width),
      diameter: conv(state.diameter),
      depth: conv(state.depth),
    });
  };

  return (
    <div className="space-y-4">
      {/* Shape */}
      <div className="space-y-2">
        <span className="block text-sm text-muted-foreground">{t('shapeTitle')}</span>
        <Segmented<PoolShape>
          ariaLabel={t('shapeTitle')}
          value={state.shape}
          onChange={(shape) => set({ shape })}
          options={[
            { value: 'rectangle', label: t('rectangle') },
            { value: 'circle', label: t('circle') },
          ]}
        />
      </div>

      {/* Unit */}
      <div className="space-y-2">
        <span className="block text-sm text-muted-foreground">{t('unitLabel')}</span>
        <Segmented<LengthUnit>
          ariaLabel={t('unitLabel')}
          value={state.unit}
          onChange={setUnit}
          options={[
            { value: 'm', label: t('meters') },
            { value: 'ft', label: t('feet') },
          ]}
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {state.shape === 'rectangle' ? (
          <>
            <NumberInput
              id="pv-length"
              label={t('lengthLabel')}
              placeholder={t('lengthPlaceholder')}
              value={state.length}
              unit={state.unit}
              onChange={(v) => set({ length: v })}
            />
            <NumberInput
              id="pv-width"
              label={t('widthLabel')}
              placeholder={t('widthPlaceholder')}
              value={state.width}
              unit={state.unit}
              onChange={(v) => set({ width: v })}
            />
          </>
        ) : (
          <NumberInput
            id="pv-diameter"
            label={t('diameterLabel')}
            placeholder={t('diameterPlaceholder')}
            value={state.diameter}
            unit={state.unit}
            onChange={(v) => set({ diameter: v })}
          />
        )}
        <NumberInput
          id="pv-depth"
          label={t('depthLabel')}
          placeholder={t('depthPlaceholder')}
          value={state.depth}
          unit={state.unit}
          onChange={(v) => set({ depth: v })}
        />
      </div>

      {/* Result */}
      {result ? (
        <div className="rounded-xl bg-primary p-5 text-primary-foreground">
          <p className="font-mono text-xs uppercase tracking-wider opacity-80">
            {t('resultKicker')}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-3xl font-bold md:text-4xl">{nf(result.volumeL)}</span>
            <span className="text-base opacity-85">{t('litersUnit')}</span>
          </div>
          <p className="mt-1 font-mono text-xs opacity-80">
            {t('secondary', { m3: nf(result.volumeM3, 1), gal: nf(result.volumeGal) })}
          </p>
        </div>
      ) : (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{t('prompt')}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 text-sm font-semibold text-destructive transition-colors hover:text-destructive/80"
        >
          <RotateCcw className="size-4" />
          {t('reset')}
        </button>

        {onApply && (
          <Button
            type="button"
            disabled={!result}
            onClick={() => result && onApply(result.volumeL)}
          >
            <Check className="size-4" />
            {t('applyButton')}
          </Button>
        )}
      </div>
    </div>
  );
}
