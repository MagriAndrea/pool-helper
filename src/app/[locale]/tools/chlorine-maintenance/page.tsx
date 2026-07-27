'use client';

import { useTranslations } from 'next-intl';
import { useChlorineMaintenance } from '@/hooks/use-chlorine-maintenance';
import { MaintenanceForm } from '@/components/tools/chlorine-maintenance/MaintenanceForm';
import { MaintenanceResult } from '@/components/tools/chlorine-maintenance/MaintenanceResult';
import { CyaProjection } from '@/components/tools/chlorine-maintenance/CyaProjection';
import { InfoButton } from '@/components/tools/shared/InfoButton';

export default function ChlorineMaintenancePage() {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const { state, update, selectProduct, result, resetValues } = useChlorineMaintenance();

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

      <MaintenanceForm state={state} update={update} selectProduct={selectProduct} />

      <div className="mt-8 space-y-4 md:mt-10">
        <MaintenanceResult result={result} />
        <CyaProjection projection={result?.projection ?? null} />
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={resetValues}
          className="px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:text-destructive/90"
        >
          {t('reset')}
        </button>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground opacity-70">
        {t('saltWaterNote')}
      </p>
    </div>
  );
}
