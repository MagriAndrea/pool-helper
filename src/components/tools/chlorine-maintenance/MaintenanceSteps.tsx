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

/** One step per question, revealed in turn — the same flow as the shock tool. */

interface CyaStepProps {
  known: boolean;
  ppm: number | null;
  onKnownChange: (known: boolean) => void;
  onPpmChange: (ppm: number | null) => void;
}

export function CyaStep({ known, ppm, onKnownChange, onPpmChange }: CyaStepProps) {
  const t = useTranslations('Tools.ChlorineMaintenance.Steps.cya');
  return (
    <StepCard num={2} title={t('title')} subtitle={t('subtitle')}>
      <DontKnowToggle
        known={known}
        onChange={onKnownChange}
        knownLabel={t('known')}
        unknownLabel={t('unknown')}
        ariaLabel={t('title')}
      />
      {known ? (
        <div className="mt-3">
          <NumberInput
            id="maintenance-cya"
            value={ppm}
            onChange={onPpmChange}
            unit="ppm"
            placeholder={t('placeholder')}
          />
        </div>
      ) : (
        <ReassureNote>{t('unknownNote')}</ReassureNote>
      )}
    </StepCard>
  );
}

interface ProductStepProps {
  state: MaintenanceState;
  update: (patch: Partial<MaintenanceState>) => void;
  selectProduct: (productId: ProductId) => void;
}

export function ProductStep({ state, update, selectProduct }: ProductStepProps) {
  const t = useTranslations('Tools.ChlorineMaintenance.Steps.product');
  const tProducts = useTranslations('Products');
  const locale = useLocale();
  const retail = PRODUCT_RETAIL_FORMS[state.productId];

  return (
    <StepCard num={3} title={t('title')} subtitle={t('subtitle')}>
      <Select
        value={state.productId}
        onValueChange={(value) => {
          const productId = PRODUCT_IDS.find((id) => id === value);
          if (productId) selectProduct(productId);
        }}
      >
        <SelectTrigger id="maintenance-product" className="h-11 w-full text-base font-semibold">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <NumberInput
          id="maintenance-concentration"
          label={t('concentration')}
          value={state.concentrationPct}
          onChange={(value) => update({ concentrationPct: value ?? 0 })}
          unit="%"
        />
        {retail.form === 'liquid' && (
          <NumberInput
            id="maintenance-density"
            label={t('density')}
            value={state.densityKgL}
            onChange={(value) => update({ densityKgL: value })}
            unit="kg/L"
            placeholder={new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
              retail.typicalDensityKgL,
            )}
          />
        )}
      </div>
    </StepCard>
  );
}

interface CurrentFcStepProps {
  known: boolean;
  freeFC: number | null;
  onKnownChange: (known: boolean) => void;
  onFreeFcChange: (value: number | null) => void;
}

export function CurrentFcStep({
  known,
  freeFC,
  onKnownChange,
  onFreeFcChange,
}: CurrentFcStepProps) {
  const t = useTranslations('Tools.ChlorineMaintenance.Steps.fc');
  return (
    <StepCard num={4} title={t('title')} subtitle={t('subtitle')}>
      <DontKnowToggle
        known={known}
        onChange={onKnownChange}
        knownLabel={t('known')}
        unknownLabel={t('unknown')}
        ariaLabel={t('title')}
      />
      {known ? (
        <div className="mt-3">
          <NumberInput
            id="maintenance-fc"
            value={freeFC}
            onChange={onFreeFcChange}
            unit="ppm"
            placeholder={t('placeholder')}
          />
        </div>
      ) : (
        <ReassureNote>{t('unknownNote')}</ReassureNote>
      )}
    </StepCard>
  );
}

interface DemandStepProps {
  dailyFcPpm: number;
  onChange: (value: number) => void;
}

export function DemandStep({ dailyFcPpm, onChange }: DemandStepProps) {
  const t = useTranslations('Tools.ChlorineMaintenance.Steps.demand');
  const locale = useLocale();
  const nf = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);

  return (
    <StepCard num={5} title={t('title')} subtitle={t('subtitle')}>
      <NumberInput
        id="maintenance-demand"
        value={dailyFcPpm}
        onChange={(value) => onChange(value ?? 0)}
        unit={t('unit')}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        {t('howTo', {
          min: nf(DAILY_FC_DEMAND_RANGE_PPM.min),
          max: nf(DAILY_FC_DEMAND_RANGE_PPM.max),
        })}
      </p>
    </StepCard>
  );
}
