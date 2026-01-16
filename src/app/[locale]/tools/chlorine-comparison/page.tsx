'use client';

import { useTranslations } from 'next-intl';
import { useChlorineComparison } from '@/hooks/use-chlorine-comparison';
import { CalciumCard } from '@/components/tools/chlorine-comparison/CalciumCard';
import { SodiumCard } from '@/components/tools/chlorine-comparison/SodiumCard';
import { ComparisonVerdict } from '@/components/tools/chlorine-comparison/ComparisonVerdict';

export default function ChlorineComparisonPage() {
  const t = useTranslations('Tools.ChlorineComparison');
  const {
    calciumInput,
    setCalciumInput,
    sodiumInput,
    setSodiumInput,
    comparison,
  } = useChlorineComparison();

  return (
    <div className="container max-w-4xl py-8 px-4 md:py-12">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <div className="flex flex-col">
          <CalciumCard 
            input={calciumInput} 
            onChange={setCalciumInput} 
          />
        </div>
        <div className="flex flex-col">
          <SodiumCard 
            input={sodiumInput} 
            onChange={setSodiumInput} 
          />
        </div>
      </div>

      <div className="mt-8 md:mt-12">
        <ComparisonVerdict result={comparison} />
      </div>
      
      {/* Footer / Disclaimer could go here */}
      <div className="mt-12 text-center text-xs text-muted-foreground opacity-50">
        <p className="whitespace-pre-line">
          {t('Footer.disclaimer')}
        </p>
      </div>
    </div>
  );
}
