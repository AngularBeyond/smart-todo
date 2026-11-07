import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { TestUser } from '../fixtures/test-data';

export class AuthPage extends BasePage {
  // Login Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly registerSubmitButton: Locator;
  readonly alertBanner: Locator;
  readonly alertDescription: Locator;

  // Register Locators
  readonly nameInput: Locator;
  readonly lastNameInput: Locator;
  readonly createAccountLink: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.nameInput = page.locator('#name');
    this.lastNameInput = page.locator('#lastName');
    this.loginSubmitButton = page.locator('form button[type="submit"]');
    this.registerSubmitButton = page.locator('form button[type="submit"]');
    this.alertBanner = page.locator('[hlmAlert]');
    this.alertDescription = page.locator('[hlmAlertDescription]');
    this.createAccountLink = page.locator('a[routerLink="/signup"]');
    this.signInLink = page.locator('a[routerLink="/login"]');
  }

  async gotoLogin(): Promise<void> {
    await this.goto('/login');
  }

  async gotoRegister(): Promise<void> {
    await this.goto('/signup');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  async register(user: TestUser): Promise<void> {
    await this.nameInput.fill(user.name);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.registerSubmitButton.click();
  }
}
