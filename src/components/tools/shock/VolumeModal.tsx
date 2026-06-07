'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { PoolVolumeCalculator } from '@/components/tools/pool-volume/PoolVolumeCalculator';

interface VolumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the computed volume (in litres) when the user applies it. */
  onApply: (volumeL: number) => void;
}

/**
 * Hosts the reusable Pool Volume calculator. The calculator is location-agnostic
 * (same component as the standalone tool); here "Apply" feeds the volume back to
 * the Shock Step 1 field and closes the modal. Closes via X, Esc and backdrop.
 */
export function VolumeModal({ open, onOpenChange, onApply }: VolumeModalProps) {
  const t = useTranslations('Tools.Shock.Volume');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg focus:outline-none">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold">{t('modalTitle')}</Dialog.Title>
            <Dialog.Close
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted"
              aria-label={t('modalClose')}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <PoolVolumeCalculator
            onApply={(volumeL) => {
              onApply(volumeL);
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
