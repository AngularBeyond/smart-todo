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
    this.heroSubhead = page.locator('text=An Agentic Blueprint');
    this.heroHeading = page.locator('h1:has-text("The Agentic way of building modern applications in Angular")');
    this.heroDescription = page.locator('text=Smart Todo is an open-source reference template demonstrating how to adopt Agentic AI');
    this.heroCallout = page.locator('text=Explore the code. Adopt the pattern. Build the future.');
    this.valuePillars = page.locator('section:has-text("01") div:has(h2)');
    this.techCards = page.locator('section:has-text("Built with") div.grid > div');
    this.externalLinks = page.locator('section:has-text("Keep exploring") a');
    this.footer = page.locator('footer:has-text("Smart Todo is made to be remixed for Agentic AI.")');
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
