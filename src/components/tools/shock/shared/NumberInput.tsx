'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  /** Numeric value, or null when empty. */
  value: number | null;
  onChange?: (value: number | null) => void;
  unit?: string;
  readOnly?: boolean;
  disabled?: boolean;
  /** Small badge in the top-right of the field (e.g. "auto"). */
  badge?: string;
  className?: string;
}

/** Format a number for display, using a dot as decimal separator. */
function format(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(value);
}

/** Parse free-form input (accepts both '.' and ',') into a number or null. */
function parse(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (cleaned === '') return null;
  const n = Number.parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/**
 * A labeled numeric input with an optional unit suffix and "auto" badge.
 * Uses a text input with `inputMode="decimal"` so Italian users can type a comma.
 * Keeps a local string so partial entries (e.g. "1,") aren't clobbered.
 */
export function NumberInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  unit,
  readOnly,
  disabled,
  badge,
  className,
}: NumberInputProps) {
  const [text, setText] = useState<string>(format(value));

  // Keep local text in sync when the value changes from outside (autofill/reset).
  useEffect(() => {
    if (parse(text) !== value) setText(format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        {badge && (
          <span className="absolute -top-2 right-2 z-10 rounded border border-border bg-muted px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={text}
          readOnly={readOnly}
          disabled={disabled}
          aria-readonly={readOnly}
          className={cn(unit && 'pr-12', readOnly && 'bg-muted text-muted-foreground')}
          onChange={(e) => {
            setText(e.target.value);
            onChange?.(parse(e.target.value));
          }}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
