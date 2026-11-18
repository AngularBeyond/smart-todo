export interface TechnologyItem {
  name: string;
  category: string;
  detail: string;
  iconName: 'layers' | 'sparkles' | 'paintbrush' | 'server' | 'database';
}

export interface CreatorLinkItem {
  label: string;
  description: string;
  href: string;
  iconName: 'code' | 'message' | 'briefcase';
  badge: string;
}
