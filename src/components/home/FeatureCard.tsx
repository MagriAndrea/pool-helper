import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  titleKey: string;
  descriptionKey?: string;
  href: string;
  icon?: React.ElementType;
  image?: string;
  className?: string;
}

export default function FeatureCard({
  titleKey,
  descriptionKey,
  href,
  icon: Icon,
  image,
  className,
}: FeatureCardProps) {
  const t = useTranslations('Navigation'); // Assuming keys are in Navigation for now based on previous steps

  return (
    <Link
      href={href}
      className={cn(
        "dashboard-card group relative flex flex-col overflow-hidden w-full h-full",
        className
      )}
    >
      {/* Background Image Layer (subtle) */}
      {image && (
        <div
          className="absolute inset-0 z-0 opacity-10 transition-opacity group-hover:opacity-20 bg-cover bg-center grayscale group-hover:grayscale-0"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {Icon && <Icon className="h-6 w-6" />}
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2 font-mono">
          {t(titleKey)}
        </h3>

        {descriptionKey && (
          <p className="text-sm text-muted-foreground font-medium">
            {t(descriptionKey)}
          </p>
        )}
      </div>
    </Link>
  );
}
