import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AboutPage extends BasePage {
  readonly heroSubhead: Locator;
  readonly heroHeading: Locator;
  readonly heroDescription: Locator;
  readonly heroCallout: Locator;
  readonly valuePillars: Locator;
  readonly techCards: Locator;
  readonly externalLinks: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSubhead = page.locator('text=A project worth sharing');
    this.heroHeading = page.locator('h1:has-text("A calmer starting point for building better products")');
    this.heroDescription = page.locator('text=Smart Todo is an open, thoughtfully designed template');
    this.heroCallout = page.locator('text=Copy it. Learn from it. Make it yours.');
    this.valuePillars = page.locator('section:has-text("01") div:has(h2)');
    this.techCards = page.locator('section:has-text("Built with") div.grid > div');
    this.externalLinks = page.locator('section:has-text("Keep exploring") a');
    this.footer = page.locator('footer:has-text("Smart Todo is made to be remixed.")');
  }

  async gotoAbout(): Promise<void> {
    if (!this.page.url().includes('/about')) {
      await this.goto('/about');
    }
    await this.page.waitForURL(/\/about/);
    await this.heroHeading.waitFor({ state: 'visible' });
  }

  getTechCard(name: string): Locator {
    return this.techCards.filter({ hasText: name });
  }

  getExternalLink(label: string): Locator {
    return this.externalLinks.filter({ hasText: label });
  }
}
