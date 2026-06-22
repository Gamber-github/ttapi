import { Locator, Page } from "@playwright/test";

export default class BasePage {
  readonly page: Page;

  readonly logoutButton: Locator;
  readonly goBackButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logoutButton = this.page.getByRole("button", { name: "Wyloguj" });
    this.goBackButton = this.page.getByRole("button", {
      name: "Powrót Do listy",
    });
  }

  async logout() {
    await this.logoutButton.click();
  }

  async goBackToList() {
    await this.goBackButton.click();
  }
}
