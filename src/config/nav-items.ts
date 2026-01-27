
import { Beaker, Menu } from 'lucide-react';

export interface NavItem {
  href?: string;
  labelKey: string;
  icon?: React.ElementType;
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
            icon: Beaker,
        }
    ]
  },
];
