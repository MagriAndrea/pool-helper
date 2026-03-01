'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Beaker, ChevronDown } from 'lucide-react';
import { navItems } from '@/config/nav-items';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export function Navbar() {
  const t = useTranslations('Navigation');
  const tApp = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8">
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Beaker className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block font-mono text-lg tracking-tight">
              {tApp('AppName')}
            </span>
            <span className="font-bold sm:hidden font-mono tracking-tight text-lg">
              PH
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            {navItems.map((item, index) => {
              // If item has children, render a DropdownMenu
              if (item.children && item.children.length > 0) {
                const Icon = item.icon;
                return (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-max px-2">
                        {t(item.labelKey)}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.children.map((child, childIndex) => (
                        <DropdownMenuItem key={childIndex} asChild>
                          <Link href={child.href || '#'}>
                            {t(child.labelKey)}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              // If it's the home link, we might skip it in the desktop navbar right area 
              // because we already have the Logo/Title on the left.
              // But if we want to keep it consistent, we can check.
              if (item.href === '/') return null;

              // Otherwise render a simple Link (as button)
              return (
                <Button key={index} variant="ghost" className="h-8 w-max px-2" asChild>
                  <Link href={item.href || '#'}>
                    {t(item.labelKey)}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
