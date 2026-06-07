'use client';

import { useTranslations } from 'next-intl';
import type { ColorLevel } from '@/lib/calculator';
import { StepCard } from './shared/StepCard';
import { PoolColorCard } from './shared/PoolColorCard';

interface ColorStepProps {
  value: ColorLevel | null;
  onChange: (value: ColorLevel) => void;
}

// Water swatches (gradient stand-ins for photos). Keyed by color level.
const SWATCHES: Record<ColorLevel, string> = {
  perfect: 'linear-gradient(160deg, #7fc4e0, #4f9fc7)',
  light_green: 'linear-gradient(160deg, #9cc089, #7fae8a)',
  green_brown: 'linear-gradient(160deg, #8a9355, #6f7a3f)',
  dark_green: 'linear-gradient(160deg, #3f4f3c, #2a3327)',
};

const ORDER: ColorLevel[] = ['perfect', 'light_green', 'green_brown', 'dark_green'];

const LABEL_KEYS: Record<ColorLevel, { label: string; desc: string }> = {
  perfect: { label: 'perfectLabel', desc: 'perfectDescription' },
  light_green: { label: 'lightGreenLabel', desc: 'lightGreenDescription' },
  green_brown: { label: 'greenBrownLabel', desc: 'greenBrownDescription' },
  dark_green: { label: 'darkGreenLabel', desc: 'darkGreenDescription' },
};

export function ColorStep({ value, onChange }: ColorStepProps) {
  const t = useTranslations('Tools.Shock.Color');

  return (
    <StepCard num={2} title={t('title')} subtitle={t('subtitle')}>
      <div
        role="group"
        aria-label={t('title')}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {ORDER.map((level) => (
          <PoolColorCard
            key={level}
            label={t(LABEL_KEYS[level].label)}
            description={t(LABEL_KEYS[level].desc)}
            swatch={SWATCHES[level]}
            isSelected={value === level}
            onClick={() => onChange(level)}
          />
        ))}
      </div>
    </StepCard>
  );
}
