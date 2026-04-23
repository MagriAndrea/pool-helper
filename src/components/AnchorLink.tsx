'use client';

import { forwardRef, AnchorHTMLAttributes, MouseEvent } from 'react';
import { Link, usePathname } from '@/i18n/routing';

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Full href like "/#chemistry". The fragment part is extracted as the hash. */
  href: string;
}

/**
 * Link to an in-page anchor that lives on the home page.
 * - On home → plain `<a href="#hash">` with programmatic smooth scroll.
 * - Elsewhere → next-intl `<Link>` so we keep client-side nav and the locale prefix.
 *
 * Smooth scroll is intentionally JS-driven instead of relying on a global
 * `html { scroll-behavior: smooth }`: the CSS variant also animates the router's
 * scroll reset, leaving new pages stuck partway down.
 */
export const AnchorLink = forwardRef<HTMLAnchorElement, AnchorLinkProps>(
  function AnchorLink({ href, children, onClick, ...rest }, ref) {
    const pathname = usePathname();
    const hash = href.includes('#') ? href.split('#')[1] ?? '' : '';
    const isOnHome = pathname === '/';

    if (isOnHome) {
      const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || !hash) return;
        const target = document.getElementById(hash);
        if (!target) return;
        e.preventDefault();
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        history.replaceState(null, '', `#${hash}`);
      };

      return (
        <a ref={ref} href={`#${hash}`} onClick={handleClick} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }
);
