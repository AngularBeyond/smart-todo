export interface TechnologyItem {
  name: string;
  detail: string;
  category?: string;
  iconName?: 'layers' | 'sparkles' | 'paintbrush' | 'server' | 'database';
}

export interface CreatorLinkItem {
  label: string;
  href: string;
  iconName: 'code' | 'message' | 'briefcase';
  description?: string;
  badge?: string;
}
