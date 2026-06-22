import { Locator, Page } from "@playwright/test";
import BasePage from "./basePage";

export class TicketsPage extends BasePage {
  readonly newTicketButton: Locator;
  readonly table: Locator;
  readonly getTicketRow: (externalId: string, serviceId: number) => Locator;

  constructor(page: Page) {
    super(page);

    this.newTicketButton = page.getByRole("button", {
      name: "Nowe Zgłoszenie",
    });
    this.table = page.getByRole("table");
    this.getTicketRow = (externalId: string, serviceId: number) => {
      return page.getByRole("row").filter({ hasText: externalId }).filter({ hasText: serviceId.toString() });
    };
  }

  async goTo() {
    await this.page.goto("/");
  }

  async createNewTicket() {
    await this.newTicketButton.click();
  }

  async openTicketDetails(externalId: string, serviceId: number) {
    const ticketRow = this.getTicketRow(externalId, serviceId);
    await ticketRow.click();
  }
}
