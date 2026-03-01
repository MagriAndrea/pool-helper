
import { Beaker, Menu } from 'lucide-react';

export interface NavItem {
  href?: string;
  labelKey: string;
  icon?: React.ElementType;
  image?: string;
  descriptionKey?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    labelKey: 'tools',
    icon: Menu, // Using Menu icon as a generic icon for Tools group if needed
    children: [
      {
        href: '/tools/chlorine-comparison',
        labelKey: 'chlorineComparison',
        descriptionKey: 'chlorineComparisonDesc',
        image: '/images/chlorine_comparison.png',
        icon: Beaker,
      }
    ]
  },
];
