import { test, expect } from "@playwright/test";
import { NewTicketPage } from "../../pages/createTicketPage";
import { TicketsPage } from "../../pages/ticketsPage";
import { TicketStatus } from "../../types/ticket";

// ParityTicketStatusResolver: even serviceId → acknowledged
const EVEN_SERVICE_ID = 100002;

test.describe("Ticket List", () => {
  test("Should display the ticket list", async ({ page }) => {
    // ARRANGE
    const ticketListPage = new TicketsPage(page);
    // ACT
    await ticketListPage.goTo();
    // ASSERT
    await expect(ticketListPage.table).toBeVisible();
  });

  test("Should open ticket details from the list", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketListPage = new TicketsPage(page);

    await newTicketPage.goTo();
    const created = await newTicketPage.createTicket({
      description: "Ticket for list navigation test",
    });

    // ACT
    await ticketListPage.goTo();
    await ticketListPage.openTicketDetails(created.externalId!, created.serviceId!);

    // ASSERT
    await expect(page.getByRole("heading", { name: created.externalId! })).toBeVisible();
  });

  test("Should display a status badge for a ticket in the list", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketListPage = new TicketsPage(page);

    await newTicketPage.goTo();
    const created = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket for status badge visibility test",
    });

    // ACT
    await ticketListPage.goTo();
    const ticketRow = ticketListPage.getTicketRow(created.externalId!, created.serviceId!);

    // ASSERT
    await expect(ticketRow.locator(".MuiChip-root").filter({ hasText: TicketStatus.acknowledged })).toBeVisible();
  });
});
