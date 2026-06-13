import { Page, Locator, expect } from '@playwright/test';
import BasePage from './basePage';
import { NewTicketData } from './createTicketPage';
import { TicketStatus } from '../types/ticket';

export class TicketDetailsPage extends BasePage {
  readonly page: Page;

  readonly externalId: Locator;
  readonly serviceId: Locator;
  readonly description: Locator;
  readonly notesSection: Locator;
  readonly noteItems: Locator;

  readonly SuccessMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.externalId = this.page.getByRole('heading', {
      level: 5,
      name: '/TT-/d{4}-/d{4}/',
    });
    this.serviceId = page.locator('span:text-is("ID usługi") + p');
    this.description = page.locator('span:text-is("Opis") + p');
    this.notesSection = this.page.locator('div').filter({
      has: this.page.getByRole('heading', { name: /^Notatki/ }),
    });
    this.noteItems = this.notesSection.getByRole('listitem');
    this.SuccessMessage = page.getByText(
      'Zgłoszenie zostało utworzone pomyślnie',
    );
  }

  async goTo(externalId: string) {
    await this.page.goto('/tickets/' + externalId);
    await this.checkExternalID(externalId);
  }

  async checkExternalID(expectedExternalId: string) {
    const ticketHeaderLocator = this.page.getByText(expectedExternalId, {
      exact: true,
    });

    await expect(ticketHeaderLocator).toBeVisible();
  }

  async checkServiceID(expectedId: string | number) {
    await expect(this.serviceId).toHaveText(expectedId.toString());
  }

  async checkDescription(description: string) {
    await expect(this.description).toHaveText(description);
  }

  async checkStatus(expectedStatus: TicketStatus) {
    const statusLocator = this.page
      .locator('.MuiChip-root')
      .filter({ hasText: expectedStatus });

    await expect(statusLocator).toBeVisible();
  }

  async checkNoteIsVisible(expectedNoteText: string) {
    const specificNote = this.noteItems.filter({ hasText: expectedNoteText });

    await expect(specificNote).toBeVisible();
  }

  async verifyTicket(data: NewTicketData) {
    await this.checkExternalID(data.externalId!);
    await this.checkServiceID(data.serviceId!);
    await this.checkStatus(TicketStatus.acknowledged);
    await this.checkDescription(data.description);
    await this.checkNoteIsVisible(data.note!);
  }

  async successMessageIsVisible(): Promise<boolean> {
    return await this.SuccessMessage.isVisible();
  }
}
