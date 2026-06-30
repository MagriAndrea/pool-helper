import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface InfoButtonProps {
  /** Info page route, e.g. '/tools/shock/info'. */
  href: string;
}

/** Small "how it works" icon button placed on a tool page, linking to its /info page. */
export function InfoButton({ href }: InfoButtonProps) {
  const t = useTranslations('Tools.Info');

  return (
    <Link
      href={href}
      aria-label={t('buttonLabel')}
      title={t('buttonLabel')}
      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Info className="size-5" />
    </Link>
  );
}
