import React from 'react';
import { useTranslations } from 'next-intl';
import {
  calculateProductMetrics,
  PRODUCT_IDS,
  PRODUCT_RETAIL_FORMS,
  type ComparisonProductInput,
  type ComparisonSlotId,
  type ProductId,
} from '@/lib/calculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  slot: ComparisonSlotId;
  input: ComparisonProductInput;
  onChange: (input: ComparisonProductInput) => void;
  onProductChange: (productId: ProductId) => void;
}

/** Slot accent colors. The accent belongs to the slot, not to the chemical. */
const SLOT_STYLES: Record<ComparisonSlotId, { border: string; text: string; badge: string }> = {
  A: { border: 'border-l-info', text: 'text-info', badge: 'bg-info/10' },
  B: { border: 'border-l-warning', text: 'text-warning', badge: 'bg-warning/10' },
};

/**
 * One side of the comparison. Identical for every product: the product itself is
 * a choice inside the card, which is what allows two products of the same type
 * to be compared against each other.
 */
export function ProductCard({ slot, input, onChange, onProductChange }: ProductCardProps) {
  const t = useTranslations('Tools.ChlorineComparison');
  const tProducts = useTranslations('Products');

  const retail = PRODUCT_RETAIL_FORMS[input.productId];
  const isLiquid = retail.form === 'liquid';
  const styles = SLOT_STYLES[slot];
  const fieldId = (field: string) => `slot_${slot}_${field}`;

  // Two probes rather than re-deriving the arithmetic here: the card shows
  // exactly what the API computes. The mass does not depend on the price, so a
  // nominal price of 1 reveals it before the user has entered a real one.
  const massProbe = calculateProductMetrics({ ...input, price: 1 });
  const metrics = calculateProductMetrics(input);

  const handleChange = (field: keyof ComparisonProductInput, value: string | number) => {
    onChange({ ...input, [field]: value });
  };

  const handleNumericChange = (field: keyof ComparisonProductInput, value: string) => {
    const parsed = parseFloat(value);
    onChange({ ...input, [field]: Number.isNaN(parsed) ? 0 : parsed });
  };

  return (
    <Card className={cn('h-full border-l-4 shadow-md', styles.border)}>
      <CardHeader className="gap-3">
        <CardTitle className={cn('flex items-center gap-2 text-xl', styles.text)}>
          <span
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              styles.badge,
            )}
          >
            {slot}
          </span>
          {t('Labels.slotTitle', { slot })}
        </CardTitle>

        {/*
          Choosing the product is the first decision, and every field below only
          makes sense once it is made — so it leads the card, on its own panel,
          with the form description reading as an answer to it rather than as a
          claim about a product the user has not visibly chosen yet.
        */}
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <Label
            htmlFor={fieldId('product')}
            className="text-xs font-semibold uppercase tracking-wide"
          >
            {t('Labels.product')}
          </Label>
          <Select
            value={input.productId}
            onValueChange={(value) => {
              // Narrow the widget's plain string back to a ProductId without a cast.
              const productId = PRODUCT_IDS.find((id) => id === value);
              if (productId) onProductChange(productId);
            }}
          >
            <SelectTrigger
              id={fieldId('product')}
              className="h-11 w-full border-2 bg-card text-base font-semibold"
            >
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
          <CardDescription>
            {isLiquid ? t('Labels.formLiquid') : t('Labels.formSolid')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unit toggle — only a liquid can be bought by the litre. */}
        {isLiquid && (
          <div className="flex w-full items-center rounded-md border p-1">
            <Button
              variant="ghost"
              onClick={() => handleChange('unit', 'l')}
              className={cn(
                'flex-1 rounded-sm',
                input.unit === 'l' ? 'bg-secondary shadow-sm' : 'hover:bg-transparent',
              )}
            >
              {t('Labels.liters')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleChange('unit', 'kg')}
              className={cn(
                'flex-1 rounded-sm',
                input.unit === 'kg' ? 'bg-secondary shadow-sm' : 'hover:bg-transparent',
              )}
            >
              {t('Labels.kilograms')}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={fieldId('quantity')}>
            {input.unit === 'l' ? t('Labels.packageVolume') : t('Labels.packageWeight')}
          </Label>
          <Input
            id={fieldId('quantity')}
            type="number"
            placeholder={input.unit === 'l' ? t('Placeholders.volume') : t('Placeholders.weight')}
            value={input.quantity || ''}
            onChange={(e) => handleNumericChange('quantity', e.target.value)}
          />
        </div>

        {input.unit === 'l' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-slow">
            <Label htmlFor={fieldId('density')}>{t('Labels.density')}</Label>
            <Input
              id={fieldId('density')}
              type="number"
              step="0.01"
              placeholder={t('Placeholders.density')}
              value={input.density || ''}
              onChange={(e) => handleNumericChange('density', e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={fieldId('price')}>{t('Labels.totalPrice')}</Label>
          <Input
            id={fieldId('price')}
            type="number"
            placeholder={t('Placeholders.price')}
            value={input.price || ''}
            onChange={(e) => handleNumericChange('price', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId('concentration')}>{t('Labels.concentration')}</Label>
          <Input
            id={fieldId('concentration')}
            type="number"
            max={100}
            placeholder={t('Placeholders.concentration')}
            value={input.concentration || ''}
            onChange={(e) => handleNumericChange('concentration', e.target.value)}
          />
        </div>

        {/* Transparency section */}
        {massProbe.isValid && (
          <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{t('Labels.activeChlorine')}:</span>
              <span className="font-medium">{massProbe.activeMass.toFixed(2)} kg</span>
            </div>
            {metrics.isValid && (
              <div className="mt-1 flex justify-between">
                <span>{t('Labels.realCost')}:</span>
                <span className="font-medium">{metrics.pricePerActiveKg.toFixed(2)} €/kg</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
