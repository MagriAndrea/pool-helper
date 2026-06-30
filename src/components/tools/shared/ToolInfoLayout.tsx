import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface ToolInfoLayoutProps {
  title: string;
  subtitle?: string;
  /** Tool route to return to, e.g. '/tools/shock'. */
  backHref: string;
  children: React.ReactNode;
}

/**
 * Shared scaffold for every tool's `/info` page (full transparency docs):
 * back link, title/subtitle, and a vertical stack of sections.
 */
export function ToolInfoLayout({ title, subtitle, backHref, children }: ToolInfoLayoutProps) {
  const t = useTranslations('Tools.Info');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </Link>

      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
      </header>

      <div className="space-y-8">{children}</div>
    </div>
  );
}
