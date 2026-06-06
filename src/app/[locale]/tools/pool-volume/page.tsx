'use client';

import { useTranslations } from 'next-intl';
import { PoolVolumeCalculator } from '@/components/tools/pool-volume/PoolVolumeCalculator';

export default function PoolVolumePage() {
  const t = useTranslations('Tools.PoolVolume');

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 md:py-12">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <PoolVolumeCalculator />
      </div>
    </div>
  );
}
