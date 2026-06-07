'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import type {
  ColorLevel,
  ProductId,
  ProductUnit,
  RangeOrValue,
  ShockResult,
} from '@/lib/calculator';
import { CYA_UNKNOWN_RANGE } from '@/lib/calculator';
import { NumberInput } from './shared/NumberInput';
import { ProductCard } from './shared/ProductCard';
import type { ShockState } from '@/hooks/use-shock-calculator';

/** Mean of the assumed CYA range (shown transparently instead of "estimated"). */
const CYA_ASSUMED_MEAN = (CYA_UNKNOWN_RANGE.min + CYA_UNKNOWN_RANGE.max) / 2;

interface ResultStepProps {
  result: ShockResult | null;
  state: ShockState;
  update: (patch: Partial<ShockState>) => void;
  onReset: () => void;
}

const COLOR_LABEL_KEY: Record<ColorLevel, string> = {
  perfect: 'Color.perfectLabel',
  light_green: 'Color.lightGreenLabel',
  green_brown: 'Color.greenBrownLabel',
  dark_green: 'Color.darkGreenLabel',
};

const PRODUCT_UNIT_KEY: Record<ProductUnit, string> = {
  g: 'Result.finalUnitG',
  kg: 'Result.finalUnitKg',
  mL: 'Result.finalUnitMl',
  L: 'Result.finalUnitL',
};

const meanOf = (r: RangeOrValue): number => (r.isRange ? (r.min + r.max) / 2 : r.value);

export function ResultStep({ result, state, update, onReset }: ResultStepProps) {
  const t = useTranslations('Tools.Shock');
  const locale = useLocale();

  const nf = (n: number, maxFrac = 2) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: maxFrac }).format(n);

  const resetButton = (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:text-destructive/80"
      >
        <RotateCcw className="size-4" />
        {t('Result.restartButton')}
      </button>
    </div>
  );

  if (!result) return null;

  // ---- Branch A: perfect water, no shock needed ----
  if (result.target.targetFC === null) {
    return (
      <section className="rounded-xl border-2 border-green-500/60 bg-green-500/5 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <h2 className="text-xl font-semibold">{t('Result.noShockTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Result.noShockBody')}</p>
          </div>
        </div>

        <div className="mt-4 max-w-xs">
          <NumberInput
            id="shock-cc-check"
            label={t('Chlorine.combinedLabel')}
            placeholder={t('Chlorine.combinedPlaceholder')}
            value={state.combinedCC}
            unit={t('Chlorine.unit')}
            onChange={(v) => update({ combinedCC: v })}
          />
        </div>

        {resetButton}
      </section>
    );
  }

  // ---- Branch B: free chlorine already sufficient ----
  if (result.isNoShockNeeded) {
    return (
      <section className="rounded-xl border-2 border-green-500/60 bg-green-500/5 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <h2 className="text-xl font-semibold">{t('Result.noShockTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Warnings.alreadyEnough')}</p>
          </div>
        </div>
        {resetButton}
      </section>
    );
  }

  // ---- Branch C: normal shock result ----
  const { breakdown, dose, product } = result;
  const pure = dose!.pureChlorine;
  const approx = pure.isRange;

  // What's missing → drives the "average" warning wording.
  const missingParts: string[] = [];
  if (breakdown.cyaAssumed) missingParts.push(t('Result.missingCya'));
  if (breakdown.currentFCAssumed) missingParts.push(t('Result.missingChlorine'));
  const missing = missingParts.join(t('Result.missingJoiner'));

  // Pure chlorine — show the MEAN; the range lives in the warning.
  const pureMeanG = meanOf(pure);
  const pureKg = pureMeanG >= 1000;
  const pureBig = nf(pureKg ? pureMeanG / 1000 : pureMeanG);
  const pureUnitLabel = pureKg ? t('Result.pureUnitKg') : t('Result.pureUnitG');
  const pureShortUnit = pureKg ? 'kg' : 'g';

  // Breakdown values (means, single numbers — never ranges, to avoid dash confusion).
  const targetMean = breakdown.targetFC ? meanOf(breakdown.targetFC) : 0;
  const targetStr = nf(targetMean, 1);
  const gapStr = breakdown.gap ? nf(meanOf(breakdown.gap), 1) : '0';
  const pureBreakdownStr = nf(pureMeanG, 0);
  const colorLabel = t(COLOR_LABEL_KEY[breakdown.colorLevel]);

  let targetLine = '';
  let winnerNote = '';
  if (breakdown.winningStrategy === 'breakpoint') {
    targetLine = t('Result.breakdownBreakpoint', { cc: nf(state.combinedCC ?? 0, 1), target: targetStr });
    winnerNote = t('Result.winnerNoteBreakpoint');
  } else if (breakdown.winningStrategy === 'floor') {
    targetLine = t('Result.breakdownFloor', { color: colorLabel, target: targetStr });
    winnerNote = t('Result.winnerNoteFloor');
  } else {
    targetLine = breakdown.cyaAssumed
      ? t('Result.breakdownSlamAssumed', {
          cya: nf(CYA_ASSUMED_MEAN),
          multiplier: nf(breakdown.multiplier ?? 1),
          color: colorLabel,
          target: targetStr,
        })
      : t('Result.breakdownSlam', {
          cya: nf(breakdown.cyaUsed ?? 0),
          multiplier: nf(breakdown.multiplier ?? 1),
          color: colorLabel,
          target: targetStr,
        });
    winnerNote = t('Result.winnerNoteSlam');
  }

  const doseLine = breakdown.currentFCAssumed
    ? t('Result.breakdownDoseAssumed', {
        volume: nf(breakdown.volumeL, 0),
        gap: gapStr,
        pure: pureBreakdownStr,
      })
    : t('Result.breakdownDose', {
        volume: nf(breakdown.volumeL, 0),
        target: targetStr,
        currentFC: nf(breakdown.currentFC ?? 0, 1),
        pure: pureBreakdownStr,
      });

  const productSelected = state.selectedProduct !== null;
  const concentration =
    state.selectedProduct === 'calcium_hypochlorite'
      ? state.calciumConcentration
      : state.sodiumConcentration;
  const selectProduct = (id: ProductId) => update({ selectedProduct: id });
  const setConcentration = (v: number | null) => {
    if (v == null) return;
    update(
      state.selectedProduct === 'calcium_hypochlorite'
        ? { calciumConcentration: v }
        : { sodiumConcentration: v },
    );
  };
  const productNameFor = (id: ProductId) =>
    id === 'calcium_hypochlorite' ? t('Result.calciumName') : t('Result.sodiumName');

  // Final product amount — mean + range warning.
  const amountMean = product ? nf(meanOf(product.amount)) : '';
  const amountUnitLabel = product ? t(PRODUCT_UNIT_KEY[product.amount.unit]) : '';

  return (
    <section className="rounded-xl border-2 border-border bg-card p-6">
      {/* Pure chlorine — big number (mean) */}
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t('Result.kicker')}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl font-bold md:text-5xl">≈ {pureBig}</span>
        <span className="text-lg text-muted-foreground">{pureUnitLabel}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('Result.explanation')}</p>

      {approx && (
        <div className="mt-3 flex items-start gap-2 rounded-md border-2 border-warning bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            {t('Result.rangeWarningPure', {
              missing,
              min: pure.isRange ? nf(pureKg ? pure.min / 1000 : pure.min) : pureBig,
              max: pure.isRange ? nf(pureKg ? pure.max / 1000 : pure.max) : pureBig,
              unit: pureShortUnit,
            })}
          </span>
        </div>
      )}

      {/* Transparent breakdown — always visible */}
      <div className="mt-4 space-y-1 rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
          {t('Result.breakdownTitle')}
          {approx && t('Result.breakdownApproxTag')}
        </p>
        <p>{targetLine}</p>
        <p>{doseLine}</p>
        {productSelected && product && (
          <p>
            {t('Result.breakdownProduct', {
              pure: pureBreakdownStr,
              concentration: nf(concentration),
              amount: amountMean,
              unit: amountUnitLabel,
              product: productNameFor(state.selectedProduct as ProductId),
            })}
          </p>
        )}
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {winnerNote}
      </p>

      <div className="my-5 border-t border-dashed border-border" />

      {/* Product selection */}
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t('Result.productSection')}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{t('Result.productSubtitle')}</p>
      <div className="mt-3 space-y-2">
        <ProductCard
          name={t('Result.sodiumName')}
          description={t('Result.sodiumDescription')}
          isSelected={state.selectedProduct === 'sodium_hypochlorite'}
          onClick={() => selectProduct('sodium_hypochlorite')}
        />
        <ProductCard
          name={t('Result.calciumName')}
          description={t('Result.calciumDescription')}
          isSelected={state.selectedProduct === 'calcium_hypochlorite'}
          onClick={() => selectProduct('calcium_hypochlorite')}
        />
      </div>

      {productSelected && (
        <div className="mt-3 max-w-[12rem]">
          <NumberInput
            id="shock-concentration"
            label={t('Result.concentrationLabel')}
            value={concentration}
            unit="%"
            onChange={setConcentration}
          />
        </div>
      )}

      {/* Final product amount (mean) — on-brand emphasis box (theme-correct in both modes) */}
      {productSelected && product && (
        <>
          <div className="mt-5 rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="font-mono text-xs uppercase tracking-wider opacity-80">
              {t('Result.finalKicker')}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-3xl font-bold md:text-4xl">≈ {amountMean}</span>
              <span className="text-base opacity-85">{amountUnitLabel}</span>
            </div>

            {/* Side effects */}
            <p className="mt-3 border-t border-primary-foreground/20 pt-2 text-xs opacity-85">
              {t('Result.sideEffectsTitle')}{' '}
              {product.sideEffects.hardnessAddedPpm > 0 &&
                t('Result.sideEffectHardness', { value: nf(product.sideEffects.hardnessAddedPpm, 1) }) + ' · '}
              {product.sideEffects.saltAddedPpm > 0 &&
                t('Result.sideEffectSalt', { value: nf(product.sideEffects.saltAddedPpm, 1) }) + ' · '}
              {product.sideEffects.pHEffect === 'up'
                ? t('Result.sideEffectPhUp')
                : t('Result.sideEffectPhNeutral')}
            </p>
          </div>

          {product.amount.isRange && (
            <div className="mt-3 flex items-start gap-2 rounded-md border-2 border-warning bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <span>
                {t('Result.rangeWarningProduct', {
                  missing,
                  min: nf(product.amount.min),
                  max: nf(product.amount.max),
                  unit: product.amount.unit,
                })}
              </span>
            </div>
          )}
        </>
      )}

      {resetButton}
    </section>
  );
}
