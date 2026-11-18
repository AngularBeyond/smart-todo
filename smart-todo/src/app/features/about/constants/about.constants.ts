import { CreatorLinkItem, TechnologyItem } from '../models';

export const TECHNOLOGIES: TechnologyItem[] = [
  {
    name: 'Angular 22',
    category: 'Framework',
    detail: 'Zoneless reactive interface layer with signal stores',
    iconName: 'layers',
  },
  {
    name: 'Spartan UI',
    category: 'UI Primitives',
    detail: 'Accessible headless and styled components with Tailwind',
    iconName: 'sparkles',
  },
  {
    name: 'Tailwind CSS',
    category: 'Styling',
    detail: 'Utility-first token-driven design system with dark mode',
    iconName: 'paintbrush',
  },
  {
    name: 'NestJS 12+',
    category: 'Backend Runtime',
    detail: 'Modular transactional backend foundation and API contracts',
    iconName: 'server',
  },
  {
    name: 'Prisma ORM',
    category: 'Database ORM',
    detail: 'Type-safe database mapping with TiDB cloud connectivity',
    iconName: 'database',
  },
];

export const CREATOR_LINKS: CreatorLinkItem[] = [
  {
    label: 'GitHub repository',
    description: 'Explore the source code, open issues, and star the template on GitHub',
    href: 'https://github.com/AngularBeyond/smart-todo',
    iconName: 'code',
    badge: 'Open Source',
  },
  {
    label: 'Twitter / X',
    description: 'Follow creator announcements, releases, and discussions',
    href: 'https://x.com/marcotello',
    iconName: 'message',
    badge: 'Social',
  },
  {
    label: 'LinkedIn',
    description: 'Connect with Marco Tello for professional updates and networking',
    href: 'https://www.linkedin.com/in/marcotello/',
    iconName: 'briefcase',
    badge: 'Network',
  },
  {
    label: 'Creator GitHub',
    description: 'Check out other open-source projects, repositories, and contributions',
    href: 'https://github.com/marcotello',
    iconName: 'code',
    badge: 'Profile',
  },
];
