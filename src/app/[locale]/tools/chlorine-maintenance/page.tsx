'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useChlorineMaintenance } from '@/hooks/use-chlorine-maintenance';
import {
  CyaStep,
  ProductStep,
  CurrentFcStep,
  DemandStep,
} from '@/components/tools/chlorine-maintenance/MaintenanceSteps';
import { MaintenanceResult } from '@/components/tools/chlorine-maintenance/MaintenanceResult';
import { CyaProjection } from '@/components/tools/chlorine-maintenance/CyaProjection';
import { VolumeStep } from '@/components/tools/shared/VolumeStep';
import { VolumeModal } from '@/components/tools/shared/VolumeModal';
import { InfoButton } from '@/components/tools/shared/InfoButton';

export default function ChlorineMaintenancePage() {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const tProducts = useTranslations('Products');
  const { state, update, selectProduct, result, resetValues } = useChlorineMaintenance();
  const [modalOpen, setModalOpen] = useState(false);

  // --- Reveal predicates: one question at a time, same flow as the shock tool.
  const volumeValid = !!state.volume && state.volume.value > 0;
  const cyaAnswered = state.cyaKnown ? state.cyaPpm != null : true;
  const fcAnswered = state.fcKnown ? state.freeFC != null : true;
  const showCya = volumeValid;
  const showProduct = showCya && cyaAnswered;
  const showFc = showProduct && state.concentrationPct > 0;
  const showDemand = showFc && fcAnswered;
  const showResult = showDemand && state.dailyFcPpm > 0 && result !== null;

  // --- Scroll to a step the first time it appears ---
  const refs = {
    cya: useRef<HTMLDivElement>(null),
    product: useRef<HTMLDivElement>(null),
    fc: useRef<HTMLDivElement>(null),
    demand: useRef<HTMLDivElement>(null),
    result: useRef<HTMLDivElement>(null),
  };
  const prevShown = useRef({
    cya: false,
    product: false,
    fc: false,
    demand: false,
    result: false,
  });

  useEffect(() => {
    const shown = {
      cya: showCya,
      product: showProduct,
      fc: showFc,
      demand: showDemand,
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
    prevShown.current = shown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCya, showProduct, showFc, showDemand, showResult]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-2 flex justify-end">
        <InfoButton href="/tools/chlorine-maintenance/info" />
      </div>

      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-4">
        <p className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
          {t('revealHint')}
        </p>

        <VolumeStep
          num={1}
          value={state.volume}
          onChange={(volume) => update({ volume })}
          onOpenModal={() => setModalOpen(true)}
        />

        {showCya && (
          <div ref={refs.cya}>
            <CyaStep
              known={state.cyaKnown}
              ppm={state.cyaPpm}
              onKnownChange={(cyaKnown) => update({ cyaKnown })}
              onPpmChange={(cyaPpm) => update({ cyaPpm })}
            />
          </div>
        )}

        {showProduct && (
          <div ref={refs.product}>
            <ProductStep state={state} update={update} selectProduct={selectProduct} />
          </div>
        )}

        {showFc && (
          <div ref={refs.fc}>
            <CurrentFcStep
              known={state.fcKnown}
              freeFC={state.freeFC}
              onKnownChange={(fcKnown) => update({ fcKnown })}
              onFreeFcChange={(freeFC) => update({ freeFC })}
            />
          </div>
        )}

        {showDemand && (
          <div ref={refs.demand}>
            <DemandStep
              dailyFcPpm={state.dailyFcPpm}
              onChange={(dailyFcPpm) => update({ dailyFcPpm })}
            />
          </div>
        )}

        {showResult && result && (
          <div ref={refs.result} className="space-y-4">
            <MaintenanceResult result={result} productName={tProducts(state.productId)} />
            <CyaProjection projection={result.projection} />
          </div>
        )}
      </div>

      {volumeValid && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={resetValues}
            className="px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:text-destructive/90"
          >
            {t('reset')}
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground/60">{t('saltWaterNote')}</p>

      <VolumeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApply={(volumeL) => update({ volume: { value: Math.round(volumeL), unit: 'L' } })}
      />
    </div>
  );
}
