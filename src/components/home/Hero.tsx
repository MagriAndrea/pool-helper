import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('HomePage');

  return (
    <section className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in-down">
      <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400">
        {t('title')}
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl px-4">
        {t('welcome')}
      </p>
    </section>
  );
}
