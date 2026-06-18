import { test, expect } from "@playwright/test";
import { NewTicketPage } from "../../../pages/createTicketPage";
import { TicketsPage } from "../../../pages/ticketsPage";
import { authStatePath } from "../../../../playwright.config";

test.describe("Tenant isolation", () => {
  test("Ticket created by beta user is not visible to gamma user", async ({ browser }) => {
    // ARRANGE
    const betaContext = await browser.newContext({
      storageState: authStatePath("beta"),
    });
    const gammaContext = await browser.newContext({
      storageState: authStatePath("gamma"),
    });

    const betaPage = await betaContext.newPage();
    const gammaPage = await gammaContext.newPage();

    try {
      // ACT
      const newTicketPage = new NewTicketPage(betaPage);
      await newTicketPage.goTo();
      const createdTicket = await newTicketPage.createTicket({
        description: "Ticket created by beta — must not be visible to gamma",
      });

      // ACT
      const ticketsPage = new TicketsPage(gammaPage);
      await ticketsPage.goTo();
      await expect(ticketsPage.table).toBeVisible();

      // ASSERT
      const ticketRow = ticketsPage.getTicketRow(createdTicket.externalId!, createdTicket.serviceId!);
      await expect(ticketRow).not.toBeVisible();
    } finally {
      await betaContext.close();
      await gammaContext.close();
    }
  });
});
