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
  readonly externalIdInput: Locator;
  readonly serviceIDInput: Locator;
  readonly descriptionTextArea: Locator;
  readonly initialNoteTextArea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.externalIdInput = page.getByRole("textbox", {
      name: "ID zewnętrzny",
    });
    this.serviceIDInput = page.getByRole("spinbutton", {
      name: "ID usługi",
    });
    this.descriptionTextArea = page.getByRole("textbox", { name: "Opis" });
    this.initialNoteTextArea = page.getByRole("textbox", {
      name: "Notatka inicjalna (opcjonalna)",
    });
    this.submitButton = page.getByRole("button", {
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
