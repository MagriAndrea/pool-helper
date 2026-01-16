import React from 'react';
import { useTranslations } from 'next-intl';
import { SodiumInput } from '@/lib/calculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SodiumCardProps {
  input: SodiumInput;
  onChange: (input: SodiumInput) => void;
}

export function SodiumCard({ input, onChange }: SodiumCardProps) {
  const t = useTranslations('Tools.ChlorineComparison');

  const handleChange = (field: keyof SodiumInput, value: string | number) => {
    onChange({
      ...input,
      [field]: value,
    });
  };

  return (
    <Card className="h-full border-l-4 border-l-yellow-500 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-yellow-600 dark:text-yellow-400">
          {t('Labels.sodiumTitle')}
        </CardTitle>
        <CardDescription>
          {t('Labels.sodiumSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Unit Toggle */}
        <div className="flex w-full items-center rounded-md border p-1">
          <Button
            variant="ghost"
            onClick={() => handleChange('unit', 'l')}
            className={cn(
              "flex-1 rounded-sm",
              input.unit === 'l' ? "bg-secondary shadow-sm" : "hover:bg-transparent"
            )}
          >
            {t('Labels.liters')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleChange('unit', 'kg')}
            className={cn(
              "flex-1 rounded-sm",
              input.unit === 'kg' ? "bg-secondary shadow-sm" : "hover:bg-transparent"
            )}
          >
            {t('Labels.kilograms')}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="na_qty">
            {t('Labels.volumeOrWeight')}
          </Label>
          <Input
            id="na_qty"
            type="number"
            placeholder={t('Placeholders.sodiumQty')}
            value={input.quantity || ''}
            onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
          />
        </div>

        {input.unit === 'l' && (
           <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
             <Label htmlFor="na_density">{t('Labels.density')}</Label>
             <Input
               id="na_density"
               type="number"
               step="0.01"
               placeholder={t('Placeholders.density')}
               value={input.density || ''}
               onChange={(e) => handleChange('density', parseFloat(e.target.value) || 0)}
             />
           </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="na_price">{t('Labels.totalPrice')}</Label>
          <Input
            id="na_price"
            type="number"
            placeholder={t('Placeholders.price')}
            value={input.price || ''}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="na_conc">{t('Labels.concentration')}</Label>
          <Input
            id="na_conc"
            type="number"
            max={100}
            placeholder={t('Placeholders.concentration')}
            value={input.concentration || ''}
            onChange={(e) => handleChange('concentration', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Transparency Section */}
        {input.quantity > 0 && input.concentration > 0 && (
           <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
             <div className="flex justify-between">
                <span>{t('Labels.activeChlorine')}:</span>
                <span className="font-medium">
                  {(() => {
                    const density = (input.unit === 'l' && input.density && input.density > 0) ? input.density : 1.2;
                    const grossMass = input.unit === 'l' ? input.quantity * density : input.quantity;
                    const activeMass = grossMass * (input.concentration / 100);
                    return `${activeMass.toFixed(2)} kg`;
                  })()}
                </span>
             </div>
             {input.price > 0 && (
                <div className="flex justify-between mt-1">
                  <span>{t('Labels.realCost')}:</span>
                  <span className="font-medium">
                   {(() => {
                    const density = (input.unit === 'l' && input.density && input.density > 0) ? input.density : 1.2;
                    const grossMass = input.unit === 'l' ? input.quantity * density : input.quantity;
                    const activeMass = grossMass * (input.concentration / 100);
                    return `${(input.price / activeMass).toFixed(2)} €/kg`;
                  })()}
                  </span>
                </div>
             )}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
