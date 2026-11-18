export interface TechnologyItem {
  name: string;
  detail: string;
  logoSrc?: string;
  invertInDarkMode?: boolean;
  category?: string;
  iconName?: 'layers' | 'sparkles' | 'paintbrush' | 'server' | 'database';
}

export interface CreatorLinkItem {
  label: string;
  href: string;
  iconName: 'github' | 'twitter' | 'linkedin' | 'code' | 'message' | 'briefcase';
  description?: string;
  badge?: string;
}
