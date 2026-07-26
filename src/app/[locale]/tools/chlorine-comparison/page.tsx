'use client';

import { useTranslations } from 'next-intl';
import { useChlorineComparison } from '@/hooks/use-chlorine-comparison';
import { ProductCard } from '@/components/tools/chlorine-comparison/ProductCard';
import { ComparisonVerdict } from '@/components/tools/chlorine-comparison/ComparisonVerdict';
import { InfoButton } from '@/components/tools/shared/InfoButton';

export default function ChlorineComparisonPage() {
  const t = useTranslations('Tools.ChlorineComparison');
  const { slots, setSlot, setSlotProduct, comparison, resetValues } = useChlorineComparison();

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:py-12">
      <div className="mb-2 flex justify-end">
        <InfoButton href="/tools/chlorine-comparison/info" />
      </div>
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* What this tool is and how to drive it, before the first input. */}
      <ol className="mx-auto mb-8 grid max-w-2xl gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3">
        {(['step1', 'step2', 'step3'] as const).map((step, index) => (
          <li key={step} className="flex gap-2.5">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-muted-foreground">{t(`HowTo.${step}`)}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <div className="flex flex-col">
          <ProductCard
            slot="A"
            input={slots.slotA}
            onChange={(input) => setSlot('A', input)}
            onProductChange={(productId) => setSlotProduct('A', productId)}
          />
        </div>
        <div className="flex flex-col">
          <ProductCard
            slot="B"
            input={slots.slotB}
            onChange={(input) => setSlot('B', input)}
            onProductChange={(productId) => setSlotProduct('B', productId)}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={resetValues}
          className="px-4 py-2 text-sm font-medium text-destructive hover:text-destructive/90 transition-colors"
        >
          {t('reset')}
        </button>
      </div>

      <div className="mt-8 md:mt-12">
        <ComparisonVerdict result={comparison} />
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground opacity-50">
        <p className="whitespace-pre-line">
          {t('Footer.disclaimer')}
        </p>
      </div>
    </div>
  );
}
