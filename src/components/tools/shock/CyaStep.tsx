'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { CYA_HIGH_THRESHOLD } from '@/lib/calculator';
import { AnchorLink } from '@/components/AnchorLink';
import { StepCard } from './shared/StepCard';
import { NumberInput } from './shared/NumberInput';
import { DontKnowToggle } from './shared/DontKnowToggle';
import { ReassureNote } from './shared/ReassureNote';

interface CyaStepProps {
  known: boolean;
  ppm: number | null;
  onKnownChange: (known: boolean) => void;
  onPpmChange: (ppm: number | null) => void;
}

export function CyaStep({ known, ppm, onKnownChange, onPpmChange }: CyaStepProps) {
  const t = useTranslations('Tools.Shock.Cya');
  const isHigh = known && ppm != null && ppm > CYA_HIGH_THRESHOLD;

  return (
    <StepCard num={3} title={t('title')} subtitle={t('subtitle')}>
      <DontKnowToggle
        known={known}
        onChange={onKnownChange}
        knownLabel={t('knowOption')}
        unknownLabel={t('dontKnowOption')}
        ariaLabel={t('title')}
      />

      {known ? (
        <div className="mt-3 max-w-xs">
          <NumberInput
            id="shock-cya"
            label={t('label')}
            placeholder={t('placeholder')}
            value={ppm}
            onChange={onPpmChange}
            unit={t('unit')}
          />
          {isHigh && (
            <div className="mt-3 flex items-start gap-2 rounded-md border-2 border-destructive bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <span>{t('highWarning')}</span>
            </div>
          )}
        </div>
      ) : (
        <ReassureNote>{t('reassure')}</ReassureNote>
      )}

      <AnchorLink
        href="/#chemistry"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
      >
        <BookOpen className="size-4" />
        {t('learnMore')}
      </AnchorLink>
    </StepCard>
  );
}
