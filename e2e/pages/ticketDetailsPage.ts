import { expect, Page, Locator } from "@playwright/test";
import BasePage from "./basePage";

export class TicketDetailsPage extends BasePage {
  readonly externalId: Locator;
  readonly serviceId: Locator;
  readonly description: Locator;
  readonly closeButton: Locator;
  readonly notesSection: Locator;
  readonly noteItems: Locator;
  readonly noteInput: Locator;
  readonly saveNoteButton: Locator;

  constructor(page: Page) {
    super(page);

    this.externalId = page.getByRole("heading", {
      level: 5,
      name: /[A-Z]+-\d{4}-\d{4}/,
    });

    this.serviceId = page.locator('span:text-is("ID usługi") + p');
    this.description = page.locator('span:text-is("Opis") + p');

    this.closeButton = page.getByRole("button", {
      name: "Zamknij zgłoszenie",
    });

    this.notesSection = page.locator("div").filter({
      has: this.page.getByRole("heading", { name: /^Notatki/ }),
    });
    this.noteItems = this.notesSection.getByRole("listitem");
    this.noteInput = page.getByRole("textbox", { name: "Treść Notatki" });
    this.saveNoteButton = page.getByRole("button", { name: "Dodaj Notatkę" });
  }

  async goTo(externalId: string) {
    await this.page.goto("/tickets/" + externalId);
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
    return this.page.locator(".MuiChip-root").filter({ hasText: expectedStatus });
  }

  async getSpecificNote(expectedNoteText: string): Promise<Locator> {
    return this.noteItems.filter({ hasText: expectedNoteText });
  }

  async closeTicket() {
    await this.closeButton.click();
  }

  async saveGivenNote(note: string) {
    await this.noteInput.fill(note);
    await this.saveNoteButton.click();
    await expect(this.noteItems.filter({ hasText: note })).toBeVisible();
  }
}
