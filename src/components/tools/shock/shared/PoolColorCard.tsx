'use client';

import { cn } from '@/lib/utils';

interface PoolColorCardProps {
  label: string;
  description: string;
  /** CSS gradient/color representing the water (swatch stand-in for a photo). */
  swatch: string;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Selectable water-condition card (Step 2). Renders a stylized water swatch +
 * label. Photos can replace the swatch later via the `swatch`/image prop.
 */
export function PoolColorCard({
  label,
  description,
  swatch,
  isSelected,
  onClick,
}: PoolColorCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer flex-col rounded-xl border-2 p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border',
      )}
    >
      <span
        className={cn(
          'relative h-20 w-full overflow-hidden rounded-lg border-2 transition-all',
          isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border',
        )}
        style={{ background: swatch }}
      >
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255,255,255,.25) 0 6px, rgba(0,0,0,.06) 6px 12px)',
          }}
        />
      </span>
      <span className="mt-2 text-sm font-medium leading-tight">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
