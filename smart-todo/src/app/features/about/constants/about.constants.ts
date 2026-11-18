import { CreatorLinkItem, TechnologyItem } from '../models';

export const TECHNOLOGIES: TechnologyItem[] = [
  {
    name: 'Angular 22',
    detail: 'Zoneless reactive interface layer',
  },
  {
    name: 'Spartan UI',
    detail: 'Accessible headless & styled components',
  },
  {
    name: 'Tailwind CSS',
    detail: 'Utility-first styling & tokens',
  },
  {
    name: 'NestJS 12+',
    detail: 'Modular transactional backend foundation',
  },
  {
    name: 'Prisma ORM',
    detail: 'Type-safe database mapping & pooling',
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
