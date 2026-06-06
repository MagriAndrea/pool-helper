'use client';

import { cn } from '@/lib/utils';

interface ProductCardProps {
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

/** Radio-style product selector row (Result step). */
export function ProductCard({ name, description, isSelected, onClick }: ProductCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-primary' : 'border-muted-foreground',
        )}
      >
        {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{name}</span>
        <span className="block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
