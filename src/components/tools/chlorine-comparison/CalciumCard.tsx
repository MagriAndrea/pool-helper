import React from 'react';
import { useTranslations } from 'next-intl';
import { CalciumInput } from '@/lib/calculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalciumCardProps {
  input: CalciumInput;
  onChange: (input: CalciumInput) => void;
}

export function CalciumCard({ input, onChange }: CalciumCardProps) {
  // We'll trust the parent to provide translations or we can fetch them here.
  // For simplicity/performance, fetching specific namespace here.
  const t = useTranslations('Tools.ChlorineComparison');

  const handleChange = (field: keyof CalciumInput, value: string) => {
    const numValue = parseFloat(value);
    onChange({
      ...input,
      [field]: isNaN(numValue) ? 0 : numValue,
    });
  };

  return (
    <Card className="h-full border-l-4 border-l-info shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-info">
          {t('Labels.calciumTitle')}
        </CardTitle>
        <CardDescription>
          {t('Labels.calciumSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ca_weight">{t('Labels.weightPkg')}</Label>
          <Input
            id="ca_weight"
            type="number"
            placeholder={t('Placeholders.weight')}
            value={input.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ca_price">{t('Labels.totalPrice')}</Label>
          <Input
            id="ca_price"
            type="number"
            placeholder={t('Placeholders.price')}
            value={input.price || ''}
            onChange={(e) => handleChange('price', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ca_conc">{t('Labels.concentration')}</Label>
          <Input
            id="ca_conc"
            type="number"
            max={100}
            placeholder={t('Placeholders.concentration')}
            value={input.concentration || ''}
            onChange={(e) => handleChange('concentration', e.target.value)}
          />
        </div>

        
        {/* Transparency Section */}
        {input.weight > 0 && input.concentration > 0 && (
           <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
             <div className="flex justify-between">
                <span>{t('Labels.activeChlorine')}:</span>
                <span className="font-medium">
                  {(input.weight * (input.concentration / 100)).toFixed(2)} kg
                </span>
             </div>
             {input.price > 0 && (
                <div className="flex justify-between mt-1">
                  <span>{t('Labels.realCost')}:</span>
                  <span className="font-medium">
                    {(input.price / (input.weight * (input.concentration / 100))).toFixed(2)} €/kg
                  </span>
                </div>
             )}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
