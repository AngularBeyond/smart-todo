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
    href: 'https://github.com/AngularBeyond/smart-todo',
    iconName: 'code',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/marcotello',
    iconName: 'message',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/marcotello/',
    iconName: 'briefcase',
  },
  {
    label: 'Creator GitHub',
    href: 'https://github.com/marcotello',
    iconName: 'code',
  },
];
