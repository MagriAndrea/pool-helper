'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Menu, X } from 'lucide-react';
import { navItems } from '@/config/nav-items';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { AnchorLink } from '@/components/AnchorLink';

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations('Navigation');
  const tApp = useTranslations();
  const pathname = usePathname();

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t('openMenu')}
          className={cn(
            'fixed bottom-6 right-6 z-50 md:hidden',
            'w-14 h-14 rounded-2xl',
            'flex items-center justify-center',
            'bg-primary text-primary-foreground shadow-lg',
            'transition-all duration-200',
            'hover:scale-[1.05] hover:shadow-xl active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'data-[state=open]:opacity-0 data-[state=open]:scale-90 data-[state=open]:pointer-events-none',
          )}
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 md:hidden',
            'bg-background/80 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'duration-200',
          )}
        />

        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed bottom-4 right-4 left-4 z-50 md:hidden',
            'glass-panel rounded-2xl p-4 shadow-2xl',
            'max-h-[85vh] flex flex-col',
            'focus:outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4',
            'duration-200',
          )}
        >
          <Dialog.Title className="sr-only">{t('menuTitle')}</Dialog.Title>

          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="font-bold text-lg text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
            >
              {tApp('AppName')}
            </Link>
            <div className="-mr-2">
              <ModeToggle />
            </div>
          </div>

          <nav className="flex flex-col space-y-1 overflow-y-auto flex-1">
            {navItems.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <div key={index} className="flex flex-col space-y-1 mt-2 first:mt-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      {t(item.labelKey)}
                    </span>
                    {item.children.map((child, childIndex) => {
                      const ChildIcon = child.icon;
                      const isActive = pathname === child.href;
                      const classes = cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ml-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                      );
                      const content = (
                        <>
                          {ChildIcon && (
                            <ChildIcon
                              className={cn(
                                'w-5 h-5 transition-colors',
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground group-hover:text-foreground',
                              )}
                              aria-hidden="true"
                            />
                          )}
                          <span>{t(child.labelKey)}</span>
                        </>
                      );
                      if (child.isAnchor) {
                        return (
                          <AnchorLink
                            key={childIndex}
                            href={child.href || '#'}
                            className={classes}
                            onClick={() => setIsOpen(false)}
                          >
                            {content}
                          </AnchorLink>
                        );
                      }
                      return (
                        <Link
                          key={childIndex}
                          href={child.href || '#'}
                          className={classes}
                          onClick={() => setIsOpen(false)}
                        >
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const Icon = item.icon;
              if (item.href === '/') return null;

              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href || '#'}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className={cn(
                  'p-2 -mr-2 rounded-full transition-colors',
                  'flex items-center gap-2 text-sm font-medium',
                  'text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <span>{t('close')}</span>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
