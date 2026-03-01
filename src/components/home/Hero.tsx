import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('HomePage');

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-24 md:py-32 text-center space-y-8 overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 z-0 bg-background/50 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center space-y-6 animate-fade-in-down max-w-4xl px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-sm font-mono tracking-tight leading-tight">
          {t('title')}
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl font-medium">
          {t('welcome')}
        </p>

        {/* We can add a placeholder for a primary CTA matching the new dashboard style */}
        <div className="mt-8">
          <button className="btn-primary text-lg px-8 py-4">
            {t('getStarted')}
          </button>
        </div>
      </div>
    </section>
  );
}
