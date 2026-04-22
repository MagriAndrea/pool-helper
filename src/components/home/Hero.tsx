import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const t = useTranslations('HomePage');

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-16 md:py-24 text-center overflow-hidden">
      {/* Background image — fully visible at top, fades out toward the bottom so it blends into the page. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      >
        <Image
          src="/images/hero_pool_background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-slower max-w-4xl px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-sm font-mono tracking-tight leading-tight">
          {t('title')}
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl font-medium">
          {t('welcome')}
        </p>
        <Button asChild size="lg" className="h-auto px-8 py-4 text-lg font-semibold">
          <a href="#tools">{t('getStarted')}</a>
        </Button>
      </div>
    </section>
  );
}
