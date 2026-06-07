'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { round2 } from '@/lib/calculator';
import { StepCard } from './shared/StepCard';
import { NumberInput } from './shared/NumberInput';
import { DontKnowToggle } from './shared/DontKnowToggle';
import { ReassureNote } from './shared/ReassureNote';

type Field = 'free' | 'combined' | 'total';
const ALL_FIELDS: Field[] = ['free', 'combined', 'total'];

interface ChlorineStepProps {
  known: boolean;
  freeFC: number | null;
  combinedCC: number | null;
  onKnownChange: (known: boolean) => void;
  onChange: (next: { freeFC: number | null; combinedCC: number | null }) => void;
}

/**
 * Step 4 — current chlorine. Three fields tied by TC = FC + CC.
 * Whenever two are filled, the third (the least-recently edited) auto-computes
 * and becomes read-only. Free + Combined are synced up to the parent.
 */
export function ChlorineStep({
  known,
  freeFC,
  combinedCC,
  onKnownChange,
  onChange,
}: ChlorineStepProps) {
  const t = useTranslations('Tools.Shock.Chlorine');

  const [free, setFree] = useState<number | null>(freeFC);
  const [combined, setCombined] = useState<number | null>(combinedCC);
  const [total, setTotal] = useState<number | null>(
    freeFC != null && combinedCC != null ? round2(freeFC + combinedCC) : null,
  );
  // The two most-recently edited fields; the remaining one is "auto".
  const [recent, setRecent] = useState<Field[]>(['free', 'combined']);
  const autoField = ALL_FIELDS.find((f) => !recent.includes(f)) as Field;

  // Keep local trio in sync if the parent values change from outside
  // (shared-key hydration / reset).
  useEffect(() => {
    if (freeFC !== free) setFree(freeFC);
    if (combinedCC !== combined) {
      setCombined(combinedCC);
      setTotal(freeFC != null && combinedCC != null ? round2(freeFC + combinedCC) : total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeFC, combinedCC]);

  const handleChange = (field: Field, val: number | null) => {
    const values: Record<Field, number | null> = { free, combined, total, [field]: val };
    const nextRecent = [field, ...recent.filter((f) => f !== field)].slice(0, 2);
    const auto = ALL_FIELDS.find((f) => !nextRecent.includes(f)) as Field;

    // Recompute the auto field from the other two.
    if (auto === 'total') {
      values.total =
        values.free != null && values.combined != null
          ? round2(values.free + values.combined)
          : null;
    } else if (auto === 'combined') {
      values.combined =
        values.total != null && values.free != null
          ? round2(Math.max(0, values.total - values.free))
          : null;
    } else {
      values.free =
        values.total != null && values.combined != null
          ? round2(Math.max(0, values.total - values.combined))
          : null;
    }

    setFree(values.free);
    setCombined(values.combined);
    setTotal(values.total);
    setRecent(nextRecent);
    onChange({ freeFC: values.free, combinedCC: values.combined });
  };

  return (
    <StepCard num={4} title={t('title')} subtitle={t('subtitle')}>
      <DontKnowToggle
        known={known}
        onChange={onKnownChange}
        knownLabel={t('knowOption')}
        unknownLabel={t('dontKnowOption')}
        ariaLabel={t('title')}
      />

      {known ? (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberInput
              id="shock-free"
              label={t('freeLabel')}
              placeholder={t('freePlaceholder')}
              value={free}
              unit={t('unit')}
              readOnly={autoField === 'free'}
              badge={autoField === 'free' ? t('autoTag') : undefined}
              onChange={(v) => handleChange('free', v)}
            />
            <NumberInput
              id="shock-combined"
              label={t('combinedLabel')}
              placeholder={t('combinedPlaceholder')}
              value={combined}
              unit={t('unit')}
              readOnly={autoField === 'combined'}
              badge={autoField === 'combined' ? t('autoTag') : undefined}
              onChange={(v) => handleChange('combined', v)}
            />
            <NumberInput
              id="shock-total"
              label={t('totalLabel')}
              placeholder={t('totalPlaceholder')}
              value={total}
              unit={t('unit')}
              readOnly={autoField === 'total'}
              badge={autoField === 'total' ? t('autoTag') : undefined}
              onChange={(v) => handleChange('total', v)}
            />
          </div>
          {combined == null && (
            <p className="mt-2 text-xs text-muted-foreground">{t('combinedNudge')}</p>
          )}
        </>
      ) : (
        <ReassureNote>{t('reassure')}</ReassureNote>
      )}
    </StepCard>
  );
}
