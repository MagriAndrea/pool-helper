'use client';

import { useTranslations } from 'next-intl';
import { Ruler } from 'lucide-react';
import { convertVolume } from '@/lib/calculator';
import type { Unit } from '@/lib/calculator';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StepCard } from '../shock/shared/StepCard';
import { NumberInput } from '../shock/shared/NumberInput';
import type { VolumeInput } from '@/lib/calculator';

interface VolumeStepProps {
  value: VolumeInput | null;
  onChange: (value: VolumeInput | null) => void;
  onOpenModal: () => void;
  /** Step number in the host tool's flow. */
  num?: number;
}

/**
 * "How much water is in the pool?" — shared by every tool that needs a volume,
 * so the unit toggle, the conversion and the escape hatch to the volume
 * calculator behave identically everywhere.
 */
export function VolumeStep({ value, onChange, onOpenModal, num = 1 }: VolumeStepProps) {
  const t = useTranslations('Tools.Volume');
  const unit: Unit = value?.unit ?? 'L';

  const setUnit = (next: Unit) => {
    if (next === unit) return;
    const converted =
      value && value.value > 0
        ? Math.round(convertVolume(value.value, unit, next))
        : (value?.value ?? 0);
    onChange({ value: converted, unit: next });
  };

  const setValue = (n: number | null) => {
    onChange(n == null ? null : { value: n, unit });
  };

  return (
    <StepCard num={num} title={t('title')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <NumberInput
            id="volume-step"
            label={t('label')}
            placeholder={t('placeholder')}
            value={value?.value ?? null}
            onChange={setValue}
            unit={unit === 'L' ? t('liters') : t('gallons')}
          />
        </div>
        <div className="space-y-2">
          <span className="block text-sm text-muted-foreground">{t('unitLabel')}</span>
          <div
            role="group"
            aria-label={t('unitLabel')}
            className="inline-flex overflow-hidden rounded-md border border-border"
          >
            {(['L', 'gal'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  u === 'L' && 'border-r border-border',
                  unit === u
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {u === 'L' ? t('liters') : t('gallons')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {unit === 'L' && <p className="mt-2 text-xs text-muted-foreground">{t('litersHint')}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('helpText')}</span>
        <Button type="button" variant="outline" size="sm" onClick={onOpenModal}>
          <Ruler className="size-4" />
          {t('calculateButton')}
        </Button>
      </div>
    </StepCard>
  );
}
