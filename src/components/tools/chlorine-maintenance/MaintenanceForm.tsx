'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  DAILY_FC_DEMAND_RANGE_PPM,
  PRODUCT_IDS,
  PRODUCT_RETAIL_FORMS,
  type ProductId,
} from '@/lib/calculator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepCard } from '@/components/tools/shock/shared/StepCard';
import { NumberInput } from '@/components/tools/shock/shared/NumberInput';
import { DontKnowToggle } from '@/components/tools/shock/shared/DontKnowToggle';
import { ReassureNote } from '@/components/tools/shock/shared/ReassureNote';
import type { MaintenanceState } from '@/hooks/use-chlorine-maintenance';

interface MaintenanceFormProps {
  state: MaintenanceState;
  update: (patch: Partial<MaintenanceState>) => void;
  selectProduct: (productId: ProductId) => void;
}

export function MaintenanceForm({ state, update, selectProduct }: MaintenanceFormProps) {
  const t = useTranslations('Tools.ChlorineMaintenance');
  const tProducts = useTranslations('Products');
  const locale = useLocale();

  const nf = (n: number, max = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: max }).format(n);

  const retail = PRODUCT_RETAIL_FORMS[state.productId];
  const volumeUnit = state.volume?.unit ?? 'L';

  return (
    <div className="space-y-4">
      <StepCard num={1} title={t('Steps.volume.title')} subtitle={t('Steps.volume.subtitle')}>
        <NumberInput
          id="maintenance_volume"
          value={state.volume?.value ?? null}
          onChange={(value) =>
            update({ volume: value == null ? null : { value, unit: volumeUnit } })
          }
          unit={volumeUnit}
          placeholder={t('Steps.volume.placeholder')}
        />
      </StepCard>

      <StepCard num={2} title={t('Steps.cya.title')} subtitle={t('Steps.cya.subtitle')}>
        <DontKnowToggle
          known={state.cyaKnown}
          onChange={(known) => update({ cyaKnown: known })}
          knownLabel={t('Steps.cya.known')}
          unknownLabel={t('Steps.cya.unknown')}
          ariaLabel={t('Steps.cya.title')}
        />
        {state.cyaKnown ? (
          <div className="mt-3">
            <NumberInput
              id="maintenance_cya"
              value={state.cyaPpm}
              onChange={(value) => update({ cyaPpm: value })}
              unit="ppm"
              placeholder={t('Steps.cya.placeholder')}
            />
          </div>
        ) : (
          <ReassureNote>{t('Steps.cya.unknownNote')}</ReassureNote>
        )}
      </StepCard>

      <StepCard num={3} title={t('Steps.product.title')} subtitle={t('Steps.product.subtitle')}>
        <Select
          value={state.productId}
          onValueChange={(value) => {
            const productId = PRODUCT_IDS.find((id) => id === value);
            if (productId) selectProduct(productId);
          }}
        >
          <SelectTrigger id="maintenance_product" className="h-11 w-full text-base font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_IDS.map((productId) => (
              <SelectItem key={productId} value={productId}>
                {tProducts(productId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <NumberInput
            id="maintenance_concentration"
            label={t('Steps.product.concentration')}
            value={state.concentrationPct}
            onChange={(value) => update({ concentrationPct: value ?? 0 })}
            unit="%"
          />
          {retail.form === 'liquid' && (
            <NumberInput
              id="maintenance_density"
              label={t('Steps.product.density')}
              value={state.densityKgL}
              onChange={(value) => update({ densityKgL: value })}
              unit="kg/L"
              placeholder={nf(retail.typicalDensityKgL)}
            />
          )}
        </div>
      </StepCard>

      <StepCard num={4} title={t('Steps.fc.title')} subtitle={t('Steps.fc.subtitle')}>
        <DontKnowToggle
          known={state.fcKnown}
          onChange={(known) => update({ fcKnown: known })}
          knownLabel={t('Steps.fc.known')}
          unknownLabel={t('Steps.fc.unknown')}
          ariaLabel={t('Steps.fc.title')}
        />
        {state.fcKnown ? (
          <div className="mt-3">
            <NumberInput
              id="maintenance_fc"
              value={state.freeFC}
              onChange={(value) => update({ freeFC: value })}
              unit="ppm"
              placeholder={t('Steps.fc.placeholder')}
            />
          </div>
        ) : (
          <ReassureNote>{t('Steps.fc.unknownNote')}</ReassureNote>
        )}
      </StepCard>

      <StepCard num={5} title={t('Steps.demand.title')} subtitle={t('Steps.demand.subtitle')}>
        <NumberInput
          id="maintenance_demand"
          value={state.dailyFcPpm}
          onChange={(value) => update({ dailyFcPpm: value ?? 0 })}
          unit={t('Steps.demand.unit')}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          {t('Steps.demand.howTo', {
            min: nf(DAILY_FC_DEMAND_RANGE_PPM.min),
            max: nf(DAILY_FC_DEMAND_RANGE_PPM.max),
          })}
        </p>
      </StepCard>
    </div>
  );
}
