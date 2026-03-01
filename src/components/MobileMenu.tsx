'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Menu, X } from 'lucide-react';
import { navItems } from '@/config/nav-items';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations('Navigation');
  const tApp = useTranslations();
  const pathname = usePathname();

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 
        OVERLAY / BACKDROP
        Rendered only when menu is open. 
        Clicking it closes the menu.
      */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 
        MAIN CONTAINER 
        Fixed at bottom-right.
        Transitions size between "button" (closed) and "panel" (open).
      */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 md:hidden flex flex-col items-end transition-all duration-300 ease-in-out",
          isOpen ? "w-auto h-auto" : "w-14 h-14"
        )}
      >

        <div
          role="button"
          tabIndex={0}
          className={cn(
            "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden",
            // If OPEN: large rounded panel, default cursor
            // If CLOSED: small circle button, pointer cursor
            isOpen
              ? "glass-panel rounded-2xl p-4 cursor-default shadow-2xl"
              : "w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-[1.05] active:scale-95 bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
          )}
          onClick={(e) => {
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (!isOpen) setIsOpen(true);
            }
            if (e.key === 'Escape') setIsOpen(false);
          }}
        >
          {isOpen ? (
            /* =========================================
               EXPANDED CONTENT (Menu is OPEN)
               ========================================= */
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">

              {/* HEADER: App Title + Mode Toggle */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                <Link href="/" onClick={() => setIsOpen(false)} className="font-bold text-lg text-primary">
                  {tApp('AppName')}
                </Link>
                <div className="-mr-2">
                  <ModeToggle />
                </div>
              </div>

              {/* NAVIGATION LINKS LOOP */}
              <nav className="flex flex-col space-y-1 overflow-y-auto max-h-[60vh]">
                {navItems.map((item, index) => {
                  // CASE 1: Item has children (Group/Category)
                  if (item.children && item.children.length > 0) {
                    return (
                      <div key={index} className="flex flex-col space-y-1 mt-2 first:mt-0">
                        {/* Section Title */}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                          {t(item.labelKey)}
                        </span>
                        {/* Children Links */}
                        {item.children.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={childIndex}
                              href={child.href || '#'}
                              className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ml-2",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {ChildIcon && <ChildIcon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
                              <span>{t(child.labelKey)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  }

                  // CASE 2: Item is a simple link
                  const Icon = item.icon;
                  // Skip Home link in menu if we want strictly tools, but user might want home here too.
                  // Current logic includes it.
                  if (item.href === '/') return null; // We already have the Title link for home

                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={index}
                      href={item.href || '#'}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {Icon && <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* FOOTER: Close Button */}
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="p-2 -mr-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <span>{t('close')}</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* =========================================
               COLLAPSED CONTENT (Menu is CLOSED)
               ========================================= */
            <Menu className="w-6 h-6" />
          )}
        </div>
      </div>
    </>
  );
}
