
import { Beaker, BookOpen, FlaskConical, Droplets, ListChecks, Menu, Zap, Ruler } from 'lucide-react';

export interface NavItem {
  href?: string;
  labelKey: string;
  icon?: React.ElementType;
  image?: string;
  descriptionKey?: string;
  children?: NavItem[];
  /**
   * When true, `href` points to an in-page anchor (e.g. `/#chemistry`) and
   * should bypass the locale-aware next-intl Link (which encodes `#`).
   */
  isAnchor?: boolean;
}

export const navItems: NavItem[] = [
  {
    labelKey: 'tools',
    icon: Menu,
    children: [
      {
        href: '/tools/chlorine-comparison',
        labelKey: 'chlorineComparison',
        descriptionKey: 'chlorineComparisonDesc',
        image: '/images/chlorine_comparison.png',
        icon: Beaker,
      },
      {
        href: '/tools/shock',
        labelKey: 'shock',
        descriptionKey: 'shockDesc',
        image: '/images/pool_shock.png',
        icon: Zap,
      },
      {
        href: '/tools/pool-volume',
        labelKey: 'poolVolume',
        descriptionKey: 'poolVolumeDesc',
        image: '/images/pool_volume.png',
        icon: Ruler,
      }
    ]
  },
  {
    labelKey: 'guide',
    icon: BookOpen,
    children: [
      {
        href: '/#chemistry',
        labelKey: 'chemistry',
        descriptionKey: 'chemistryDesc',
        icon: FlaskConical,
        isAnchor: true,
      },
      {
        href: '/#cleaning',
        labelKey: 'cleaning',
        descriptionKey: 'cleaningDesc',
        icon: Droplets,
        isAnchor: true,
      },
      {
        href: '/#actions',
        labelKey: 'actions',
        descriptionKey: 'actionsDesc',
        icon: ListChecks,
        isAnchor: true,
      },
    ]
  },
];
