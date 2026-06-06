'use client';

import { cn } from '@/lib/utils';

interface DontKnowToggleProps {
  /** true = "I know the value", false = "I don't know". */
  known: boolean;
  onChange: (known: boolean) => void;
  knownLabel: string;
  unknownLabel: string;
  ariaLabel?: string;
}

/**
 * Segmented two-option control ("I'll enter the value" | "I don't know").
 * Both options are equal-weight (no penalty), per the chosen design (Variant A).
 */
export function DontKnowToggle({
  known,
  onChange,
  knownLabel,
  unknownLabel,
  ariaLabel,
}: DontKnowToggleProps) {
  const base =
    'flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex w-full overflow-hidden rounded-md border border-border"
    >
      <button
        type="button"
        aria-pressed={known}
        onClick={() => onChange(true)}
        className={cn(
          base,
          'border-r border-border',
          known ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted',
        )}
      >
        {knownLabel}
      </button>
      <button
        type="button"
        aria-pressed={!known}
        onClick={() => onChange(false)}
        className={cn(
          base,
          !known ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted',
        )}
      >
        {unknownLabel}
      </button>
    </div>
  );
}
