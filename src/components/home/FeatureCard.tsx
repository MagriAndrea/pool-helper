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
        "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl dark:bg-black/20 dark:hover:bg-black/30",
        className
      )}
    >
      {/* Background Image Layer */}
      {image && (
        <div 
            className="absolute inset-0 z-0 opacity-20 transition-opacity group-hover:opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
        />
      )}
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col p-6 h-full">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t(titleKey)}
        </h3>
        
        {descriptionKey && (
          <p className="text-sm text-muted-foreground">
            {t(descriptionKey)}
          </p>
        )}
      </div>
    </Link>
  );
}
