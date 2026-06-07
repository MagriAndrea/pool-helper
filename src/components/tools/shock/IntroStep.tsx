import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { AnchorLink } from '@/components/AnchorLink';

/** Step 0 — intro + the mandatory pH disclaimer. */
export function IntroStep() {
  const t = useTranslations('Tools.Shock.Intro');

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
          0
        </span>
        <div>
          <h2 className="text-xl font-semibold leading-tight md:text-2xl">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed md:text-base">{t('explanation')}</p>

      <div className="mt-4 flex items-start gap-2 rounded-md border-2 border-warning bg-warning/10 p-3 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p>
          {t('phWarning')}{' '}
          <AnchorLink
            href="/#chemistry"
            className="font-medium text-primary underline underline-offset-2"
          >
            {t('phLink')}
          </AnchorLink>
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{t('callToAction')}</p>
    </section>
  );
}
