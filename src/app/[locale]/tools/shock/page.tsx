'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useShockCalculator } from '@/hooks/use-shock-calculator';
import type { ShockState } from '@/hooks/use-shock-calculator';
import { IntroStep } from '@/components/tools/shock/IntroStep';
import { VolumeStep } from '@/components/tools/shock/VolumeStep';
import { ColorStep } from '@/components/tools/shock/ColorStep';
import { CyaStep } from '@/components/tools/shock/CyaStep';
import { ChlorineStep } from '@/components/tools/shock/ChlorineStep';
import { ResultStep } from '@/components/tools/shock/ResultStep';
import { VolumeModal } from '@/components/tools/shock/VolumeModal';

export default function ShockCalculatorPage() {
  const t = useTranslations('Tools.Shock');
  const { state, setState, reset, result } = useShockCalculator();
  const [modalOpen, setModalOpen] = useState(false);

  const update = (patch: Partial<ShockState>) => setState((prev) => ({ ...prev, ...patch }));

  // --- Reveal predicates ---
  const volumeValid = !!state.volume && state.volume.value > 0;
  const isPerfect = state.colorLevel === 'perfect';
  const showColor = volumeValid;
  const cyaValid = state.cyaKnown ? state.cyaPpm != null : true;
  const showCya = !!state.colorLevel && !isPerfect;
  const showChlorine = showCya && cyaValid;
  const chlorineValid = state.chlorineKnown ? state.freeFC != null : true;
  const showResult = volumeValid && (isPerfect || (showChlorine && chlorineValid));

  // --- Scroll to a step the first time it appears ---
  const refs = {
    color: useRef<HTMLDivElement>(null),
    cya: useRef<HTMLDivElement>(null),
    chlorine: useRef<HTMLDivElement>(null),
    result: useRef<HTMLDivElement>(null),
  };
  const prevShown = useRef({ color: false, cya: false, chlorine: false, result: false });

  useEffect(() => {
    const shown = {
      color: showColor,
      cya: showChlorine ? false : showCya, // chlorine supersedes cya for scroll target
      chlorine: showChlorine,
      result: showResult,
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (Object.keys(shown) as Array<keyof typeof shown>).forEach((key) => {
      if (shown[key] && !prevShown.current[key]) {
        refs[key].current?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }
    });
    prevShown.current = {
      color: showColor,
      cya: showCya,
      chlorine: showChlorine,
      result: showResult,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showColor, showCya, showChlorine, showResult]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-4">
        <IntroStep />

        <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
          {t('Intro.revealHint')}
        </p>

        <VolumeStep
          value={state.volume}
          onChange={(v) => update({ volume: v })}
          onOpenModal={() => setModalOpen(true)}
        />

        {showColor && (
          <div ref={refs.color}>
            <ColorStep
              value={state.colorLevel}
              onChange={(level) => update({ colorLevel: level })}
            />
          </div>
        )}

        {showCya && (
          <div ref={refs.cya}>
            <CyaStep
              known={state.cyaKnown}
              ppm={state.cyaPpm}
              onKnownChange={(known) => update({ cyaKnown: known })}
              onPpmChange={(ppm) => update({ cyaPpm: ppm })}
            />
          </div>
        )}

        {showChlorine && (
          <div ref={refs.chlorine}>
            <ChlorineStep
              known={state.chlorineKnown}
              freeFC={state.freeFC}
              combinedCC={state.combinedCC}
              onKnownChange={(known) => update({ chlorineKnown: known })}
              onChange={(next) => update(next)}
            />
          </div>
        )}

        {showResult && (
          <div ref={refs.result}>
            <ResultStep result={result} state={state} update={update} onReset={reset} />
          </div>
        )}
      </div>

      <p className="mt-10 whitespace-pre-line text-center text-xs text-muted-foreground/60">
        {t('Footer.disclaimer')}
      </p>

      <VolumeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApply={(volumeL) => update({ volume: { value: Math.round(volumeL), unit: 'L' } })}
      />
    </div>
  );
}
