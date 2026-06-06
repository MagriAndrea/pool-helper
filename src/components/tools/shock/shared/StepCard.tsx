import { cn } from '@/lib/utils';

interface StepCardProps {
  num: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

/** Numbered step container shared by steps 1–4. */
export function StepCard({ num, title, subtitle, children, className }: StepCardProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 md:p-6', className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
          {num}
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight md:text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
