import { Check } from 'lucide-react';

interface ReassureNoteProps {
  children: React.ReactNode;
}

/** Green, non-penalizing note shown when the user picks "I don't know". */
export function ReassureNote({ children }: ReassureNoteProps) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md border border-green-500/60 bg-green-500/10 p-3 text-sm text-foreground">
      <Check className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
      <span>{children}</span>
    </div>
  );
}
