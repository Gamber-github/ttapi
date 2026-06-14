import { Locator, Page } from "@playwright/test";
import BasePage from "./basePage";

export interface NewTicketData {
  externalId?: string;
  serviceId?: number;
  description: string;
  note?: string;
}

export class NewTicketPage extends BasePage {
  readonly page: Page;

  readonly externalIdInput: Locator;
  readonly serviceIDInput: Locator;
  readonly validDerviceIDs: number[] = [100030];
  readonly descriptionTextArea: Locator;
  readonly noteTextArea: Locator;
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
    this.noteTextArea = this.page.getByRole("textbox", {
      name: "Notatka inicjalna (opcjonalna)",
    });
    this.submitButton = this.page.getByRole("button", {
      name: "Utwórz zgłoszenie",
    });
  }

  async goTo() {
    await this.page.goto("/tickets/new");
  }

  generateExternalId(prefix: string = "TT-2026-"): string {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNumber}`;
  }

  generateValidServiceId(): number {
    const randomIndex = Math.floor(Math.random() * this.validDerviceIDs.length);
    return this.validDerviceIDs[randomIndex];
  }

  async createTicket(data: NewTicketData): Promise<NewTicketData> {
    const prefix = data.externalId ?? "TT-2026-";
    const generatedId = this.generateExternalId(prefix);
    const targetServiceId = data.serviceId ?? this.generateValidServiceId();
    await this.externalIdInput.fill(generatedId);
    await this.serviceIDInput.fill(targetServiceId.toString());
    await this.descriptionTextArea.fill(data.description);

    if (data.note) {
      await this.noteTextArea.fill(data.note);
    }

    await this.submitButton.click();

    return {
      externalId: generatedId,
      serviceId: targetServiceId,
      description: data.description,
      note: data.note,
    };
  }
}
