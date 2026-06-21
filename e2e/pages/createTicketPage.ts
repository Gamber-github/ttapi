import { Locator, Page } from "@playwright/test";
import BasePage from "./basePage";
import { validServiceId } from "../helpers/api";

export interface NewTicketData {
  externalId?: string;
  serviceId?: number;
  description: string;
  initialNote?: string;
}

export class NewTicketPage extends BasePage {
  readonly page: Page;

  readonly externalIdInput: Locator;
  readonly serviceIDInput: Locator;
  readonly descriptionTextArea: Locator;
  readonly initialNoteTextArea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.externalIdInput = this.page.getByRole("textbox", {
      name: "ID zewnętrzny",
    });
    this.serviceIDInput = this.page.getByRole("spinbutton", {
      name: "ID usługi",
    });
    this.descriptionTextArea = this.page.getByRole("textbox", { name: "Opis" });
    this.initialNoteTextArea = this.page.getByRole("textbox", {
      name: "Notatka inicjalna (opcjonalna)",
    });
    this.submitButton = this.page.getByRole("button", {
      name: "Utwórz zgłoszenie",
    });
  }

  async goTo() {
    await this.page.goto("/tickets/new");
  }

  generateExternalId(prefix: string = "E2E-2026-"): string {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNumber}`;
  }

  generateValidServiceId(): number {
    return validServiceId();
  }

  async createTicket(data: NewTicketData): Promise<NewTicketData> {
    const generatedId = data.externalId ?? this.generateExternalId();
    const targetServiceId = data.serviceId ?? this.generateValidServiceId();
    await this.externalIdInput.fill(generatedId);
    await this.serviceIDInput.fill(targetServiceId.toString());
    await this.descriptionTextArea.fill(data.description);
    if (data.initialNote) {
      await this.initialNoteTextArea.fill(data.initialNote);
    }
    await this.submitButton.click();
    await this.page.waitForURL(`**/tickets/${generatedId}`);

    return {
      externalId: generatedId,
      serviceId: targetServiceId,
      description: data.description,
      initialNote: data.initialNote,
    };
  }
}
