import React from 'react';
import { useTranslations } from 'next-intl';
import type { ComparisonResult, ComparisonSlotId } from '@/lib/calculator';
import { cn } from '@/lib/utils';
import { Trophy, TrendingDown, Scale } from 'lucide-react';

interface ComparisonVerdictProps {
  result: ComparisonResult | null;
}

/** Winner banner colors, keyed by slot to match the cards' accents. */
const SLOT_GRADIENTS: Record<ComparisonSlotId, string> = {
  A: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
  B: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-yellow-500/25',
};

export function ComparisonVerdict({ result }: ComparisonVerdictProps) {
  const t = useTranslations('Tools.ChlorineComparison.Verdict');
  const tProducts = useTranslations('Products');

  if (!result || !result.winner) {
    return (
      <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground animate-in fade-in duration-slower">
        <Scale className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>{t('prompt')}</p>
      </div>
    );
  }

  const isDraw = result.winner === 'DRAW';
  const winnerColor =
    result.winner === 'DRAW'
      ? 'bg-secondary text-secondary-foreground'
      : SLOT_GRADIENTS[result.winner];
  // Only read in the non-draw branch below.
  const winnerMetrics = result.winner === 'A' ? result.slotA : result.slotB;

  return (
    <div
      className={cn(
        'mt-6 overflow-hidden rounded-xl shadow-lg transition-all duration-slower animate-in slide-in-from-bottom-4',
        winnerColor,
      )}
    >
      <div className="p-6 text-center">
        {isDraw ? (
          <>
            <Scale className="mx-auto mb-2 h-10 w-10" />
            <h2 className="text-2xl font-bold">{t('draw')}</h2>
            <p className="mt-1 opacity-90">{t('drawDesc')}</p>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-center space-x-2">
              <Trophy className="h-8 w-8 animate-bounce" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
                {t('winner')}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold md:text-4xl">
              {t('winnerSlot', { slot: result.winner })}
            </h2>
            <p className="mt-1 text-lg opacity-90">{tProducts(winnerMetrics.productId)}</p>

            <div className="mt-4 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
              <TrendingDown className="mr-2 h-5 w-5" />
              <span className="text-lg font-bold">
                {t('savings')} {result.savingsPerKg.toFixed(2)} €{' '}
                <span className="text-sm font-normal opacity-75">{t('perActiveKg')}</span>
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm opacity-90">
              <div>
                <span className="block text-xs uppercase opacity-75">
                  {t('slotReal', { slot: 'A' })}
                </span>
                <span className="font-mono text-lg font-bold">
                  {result.slotA.pricePerActiveKg.toFixed(2)} €/kg
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase opacity-75">
                  {t('slotReal', { slot: 'B' })}
                </span>
                <span className="font-mono text-lg font-bold">
                  {result.slotB.pricePerActiveKg.toFixed(2)} €/kg
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
