import { Locator, Page } from '@playwright/test';
import BasePage from './basePage';

export class TicketsPage extends BasePage {
  readonly page: Page;

  readonly newTicketButton: Locator;
  readonly table: Locator;
  readonly getTicketRow: (externalId: string, tenantId: number) => Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // Define selectors for elements on the ticket list page
    this.newTicketButton = this.page.getByRole('button', {
      name: 'Nowe Zgłoszenie',
    });
    this.table = this.page.getByRole('table');
    this.getTicketRow = (externalId: string, tenantId: number) => {
      return this.page
        .getByRole('row')
        .filter({ hasText: externalId })
        .filter({ hasText: tenantId.toString() });
    };
  }

  async goTo() {
    await this.page.goto('/');
  }

  async CreateNewTicket() {
    await this.newTicketButton.click();
  }

  async OpenTicketDetails(externalId: string, tenantId: number) {
    const ticketRow = this.getTicketRow(externalId, tenantId);
    await ticketRow.click();
  }
}
