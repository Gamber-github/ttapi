import { Page, Locator } from '@playwright/test';
import BasePage from './basePage';

export class TicketDetailsPage extends BasePage {
  readonly page: Page;

  readonly externalId: Locator;
  readonly serviceId: Locator;
  readonly description: Locator;
  readonly notesSection: Locator;
  readonly noteItems: Locator;
  readonly statusContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.externalId = this.page.getByRole('heading', {
      level: 5,
      name: /TT-\d{4}-\d{4}/,
    });

    this.serviceId = page.locator('span:text-is("ID usługi") + p');
    this.description = page.locator('span:text-is("Opis") + p');

    this.notesSection = this.page.locator('div').filter({
      has: this.page.getByRole('heading', { name: /^Notatki/ }),
    });
    this.noteItems = this.notesSection.getByRole('listitem');

    this.statusContainer = page.locator('.status-section-classname');
  }

  async goTo(externalId: string) {
    await this.page.goto('/tickets/' + externalId);
  }

  async getExternalID(): Promise<string> {
    return await this.externalId.innerText();
  }

  async getServiceID(): Promise<number> {
    const serviceID = await this.serviceId.innerText();
    return parseInt(serviceID, 10);
  }

  async getDescription(): Promise<string> {
    return await this.description.innerText();
  }

  async getStatus(expectedStatus: string): Promise<Locator> {
    return this.page
      .locator('.MuiChip-root')
      .filter({ hasText: expectedStatus });
  }

  async getSpecificNote(expectedNoteText: string): Promise<Locator> {
    return this.noteItems.filter({ hasText: expectedNoteText });
  }
}
