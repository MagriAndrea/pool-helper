'use client';

import { forwardRef, AnchorHTMLAttributes } from 'react';
import { Link, usePathname } from '@/i18n/routing';

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Full href like "/#chemistry". The fragment part is extracted as the hash. */
  href: string;
}

/**
 * Link to an in-page anchor that lives on the home page.
 * - On home → plain `<a href="#hash">` so the browser just scrolls (no RSC fetch, no reload).
 * - Elsewhere → next-intl `<Link>` so we keep client-side nav and the locale prefix.
 * Forwards refs/props so it can be used inside Radix `asChild` slots.
 */
export const AnchorLink = forwardRef<HTMLAnchorElement, AnchorLinkProps>(
  function AnchorLink({ href, children, ...rest }, ref) {
    const pathname = usePathname();
    const hash = href.includes('#') ? href.split('#')[1] ?? '' : '';
    const isOnHome = pathname === '/';

    if (isOnHome) {
      return (
        <a ref={ref} href={`#${hash}`} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} {...rest}>
        {children}
      </Link>
    );
  }
);
