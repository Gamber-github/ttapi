import { Locator, Page } from '@playwright/test';

export default class BasePage {
  readonly page: Page;

  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoutButton = this.page.getByRole('button', { name: 'Wyloguj' });
  }

  async logout() {
    await this.logoutButton.click();
  }
}
