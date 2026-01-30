import { navItems } from '@/config/nav-items';
import FeatureCard from './FeatureCard';
import { useTranslations } from 'next-intl';

export default function FeaturesGrid() {
  const t = useTranslations('Navigation');

  return (
    <div className="w-full max-w-5xl px-4 pb-20 space-y-12">
      {navItems.map((section) => (
        <div key={section.labelKey} className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">
            {t(section.labelKey)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.children?.map((item) => (
              <FeatureCard
                key={item.href || item.labelKey}
                titleKey={item.labelKey}
                descriptionKey={item.descriptionKey}
                href={item.href || '#'}
                icon={item.icon}
                image={item.image}
              />
            ))}
            
            {/* Fallback if no children */}
            {(!section.children || section.children.length === 0) && (
              <p className="text-muted-foreground italic col-span-full">
                No items available in this section yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
