import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { SidebarComponent } from '../../pages/sidebar.component';
import { AboutPage } from '../../pages/about.page';
import { generateUser } from '../../fixtures/test-data';

test.describe('About Page & Project Showcase E2E', () => {
  test('navigates to About page from sidebar and verifies layout, typography, and active menu item', async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const sidebar = new SidebarComponent(page);
    const aboutPage = new AboutPage(page);
    const user = generateUser('about_nav');

    // Register user and land on workspace
    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Sidebar About button should be visible
    await expect(sidebar.aboutButton).toBeVisible();

    // Click About button to navigate
    await sidebar.gotoAbout();
    await expect(page).toHaveURL(/\/about/);

    // Verify active link styling on sidebar About button
    await expect(sidebar.aboutButton).toHaveClass(/bg-sidebar-accent/);

    // Verify Hero section
    await expect(aboutPage.heroSubhead).toBeVisible();
    await expect(aboutPage.heroHeading).toBeVisible();
    await expect(aboutPage.heroDescription).toBeVisible();
    await expect(aboutPage.heroCallout).toBeVisible();

    // Verify Three Value Pillars
    await expect(page.locator('h2:has-text("The Agentic Way")')).toBeVisible();
    await expect(page.locator('h2:has-text("AG-UI & A2UI in Action")')).toBeVisible();
    await expect(page.locator('h2:has-text("A Production Template")')).toBeVisible();

    // Verify 5 Real Technology Stack Cards with Logos
    const techStacks = [
      { name: 'Angular', detail: 'Enterprise framework for web apps', logo: '/logos/angular.svg' },
      { name: 'Spartan UI', detail: 'Accessible headless & styled components', logo: '/logos/spartan.svg' },
      { name: 'CopilotKit', detail: 'Open-source UI stack for in-app AI agents', logo: '/logos/copilotkit.svg' },
      { name: 'NestJS', detail: 'Progressive Node.js framework for backends', logo: '/logos/nestjs.svg' },
      { name: 'Mastra', detail: 'Open-source TypeScript AI agent framework', logo: '/logos/mastra.svg' },
    ];

    for (const tech of techStacks) {
      const card = aboutPage.getTechCard(tech.name);
      await expect(card).toBeVisible();
      await expect(card).toContainText(tech.detail);
      const logo = aboutPage.getTechLogo(tech.name);
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', tech.logo);
    }

    // Verify Footer
    await expect(aboutPage.footer).toBeVisible();
    await expect(page.locator('text=Open template · 2026')).toBeVisible();
  });

  test('verifies external links security attributes, labels, and target URLs', async ({ page }) => {
    const authPage = new AuthPage(page);
    const sidebar = new SidebarComponent(page);
    const aboutPage = new AboutPage(page);
    const user = generateUser('about_links');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await sidebar.gotoAbout();
    await expect(page).toHaveURL(/\/about/);

    const expectedLinks = [
      {
        label: 'GitHub repository',
        href: 'https://github.com/AngularBeyond/smart-todo',
      },
      {
        label: 'X (Twitter)',
        href: 'https://x.com/marcotello',
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/marcotello/',
      },
    ];

    for (const linkData of expectedLinks) {
      const link = aboutPage.getExternalLink(linkData.label);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', linkData.href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');
      await expect(link.locator('svg').first()).toBeVisible();
    }
  });

  test('persists dark and light theme toggling on the About page across reload', async ({ page }) => {
    const authPage = new AuthPage(page);
    const sidebar = new SidebarComponent(page);
    const aboutPage = new AboutPage(page);
    const user = generateUser('about_theme');

    await authPage.gotoRegister();
    await authPage.register(user);
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    await sidebar.gotoAbout();
    await expect(page).toHaveURL(/\/about/);

    const html = page.locator('html');

    // Default light theme
    await expect(html).not.toHaveClass(/dark/);

    // Switch to dark theme via header theme toggle button
    await aboutPage.themeToggleButton.click();
    await expect(html).toHaveClass(/dark/);

    // Reload page to verify dark theme persistence on /about
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(html).toHaveClass(/dark/);
    await expect(aboutPage.heroHeading).toBeVisible();

    // Switch back to light theme
    await aboutPage.themeToggleButton.click();
    await expect(html).not.toHaveClass(/dark/);

    // Reload page to verify light theme persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(html).not.toHaveClass(/dark/);
    await expect(aboutPage.heroHeading).toBeVisible();
  });

  test('redirects unauthenticated access to /about to the /login page', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2:has-text("Sign in to your space")')).toBeVisible();
  });
});
