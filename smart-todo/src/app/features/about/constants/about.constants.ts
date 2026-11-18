import { CreatorLinkItem, TechnologyItem } from '../models';

export const TECHNOLOGIES: TechnologyItem[] = [
  {
    name: 'Angular',
    detail: 'Enterprise framework for web apps',
    logoSrc: '/logos/angular.svg',
  },
  {
    name: 'Spartan UI',
    detail: 'Accessible headless & styled components',
    logoSrc: '/logos/spartan.svg',
  },
  {
    name: 'CopilotKit',
    detail: 'Open-source UI stack for in-app AI agents',
    logoSrc: '/logos/copilotkit.svg',
  },
  {
    name: 'NestJS',
    detail: 'Progressive Node.js framework for backends',
    logoSrc: '/logos/nestjs.svg',
  },
  {
    name: 'Mastra',
    detail: 'Open-source TypeScript AI agent framework',
    logoSrc: '/logos/mastra.svg',
    invertInDarkMode: true,
  },
];

export const CREATOR_LINKS: CreatorLinkItem[] = [
  {
    label: 'GitHub repository',
    href: 'https://github.com/AngularBeyond/smart-todo',
    iconName: 'github',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/marcotello',
    iconName: 'twitter',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/marcotello/',
    iconName: 'linkedin',
  },
];
