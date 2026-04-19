import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  titleKey: string;
  descriptionKey?: string;
  href: string;
  icon?: React.ElementType;
  image?: string;
  className?: string;
  isAnchor?: boolean;
}

export default function FeatureCard({
  titleKey,
  descriptionKey,
  href,
  icon: Icon,
  image,
  className,
  isAnchor,
}: FeatureCardProps) {
  const t = useTranslations('Navigation');

  const classes = cn(
    "dashboard-card group relative flex flex-col overflow-hidden w-full h-full",
    className
  );

  // For in-page anchors (href like "/#chemistry"), use a plain <a> with just
  // the hash so we stay on the current locale's home page without a full
  // navigation that would drop the fragment through the i18n middleware.
  const anchorHref = isAnchor ? `#${href.split('#')[1] ?? ''}` : href;

  const content = (
    <>
      {image && (
        <div
          className="absolute inset-0 z-0 opacity-10 transition-opacity group-hover:opacity-20 bg-cover bg-center grayscale group-hover:grayscale-0"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      <div className="relative z-10 flex flex-col h-full space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {Icon && <Icon className="h-6 w-6" />}
        </div>

        <h3 className="text-xl font-semibold text-foreground font-mono">
          {t(titleKey)}
        </h3>

        {descriptionKey && (
          <p className="text-sm text-muted-foreground font-medium">
            {t(descriptionKey)}
          </p>
        )}
      </div>
    </>
  );

  if (isAnchor) {
    return (
      <a href={anchorHref} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
