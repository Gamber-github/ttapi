import { test, expect } from "@playwright/test";
import { NewTicketPage } from "../../../pages/createTicketPage";
import { TicketDetailsPage } from "../../../pages/ticketDetailsPage";
import { TicketStatus } from "../../../types/ticket";
import { TicketsPage } from "../../../pages/ticketsPage";

// ParityTicketStatusResolver: even serviceId → acknowledged, odd serviceId → rejected
const EVEN_SERVICE_ID = 100002;
const ODD_SERVICE_ID = 100001;

test.describe("Notes on active tickets", () => {
  test("Note can be added to an acknowledged ticket and appears in the notes list", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const noteText = "Note added to an active acknowledged ticket";

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket for add-note test",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await ticketDetailsPage.saveGivenNote(noteText);

    // ASSERT
    const noteLocator = await ticketDetailsPage.getSpecificNote(noteText);
    await expect(noteLocator).toBeVisible();
  });

  test("Multiple notes can be added sequentially to an acknowledged ticket", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const firstNote = "First note";
    const secondNote = "Second note";

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket for multiple notes test",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await ticketDetailsPage.saveGivenNote(firstNote);
    await ticketDetailsPage.saveGivenNote(secondNote);

    // ASSERT
    await expect(await ticketDetailsPage.getSpecificNote(firstNote)).toBeVisible();
    await expect(await ticketDetailsPage.getSpecificNote(secondNote)).toBeVisible();
  });

});

test.describe("Notes blocked on inactive tickets", () => {
  test("Note form is not visible on a rejected ticket", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: ODD_SERVICE_ID,
      description: "Ticket expected to be rejected",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.rejected)).toBeVisible();
    await expect(ticketDetailsPage.noteInput).not.toBeVisible();
    await expect(ticketDetailsPage.saveNoteButton).not.toBeVisible();
  });

  test("Note form is not visible on a closed ticket", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket to be closed before note test",
    });

    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await ticketDetailsPage.closeTicket();

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.closed)).toBeVisible();
    await expect(ticketDetailsPage.noteInput).not.toBeVisible();
    await expect(ticketDetailsPage.saveNoteButton).not.toBeVisible();
  });

  test("Note form is not visible on a resolved ticket", async ({ page }) => {
    // ARRANGE — resolved is system-managed; find a pre-seeded ticket via the list UI
    const ticketListPage = new TicketsPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await ticketListPage.goTo();
    await expect(ticketListPage.table.getByRole("row").nth(1)).toBeVisible();

    const resolvedRow = ticketListPage.table
      .getByRole("row")
      .filter({ has: page.locator(".MuiChip-root").filter({ hasText: TicketStatus.resolved }) })
      .first();

    if ((await resolvedRow.count()) === 0) {
      test.skip(true, "No resolved ticket visible in the list");
      return;
    }

    // ACT
    await resolvedRow.click();
    await page.waitForURL("**/tickets/**");
    await expect(ticketDetailsPage.externalId).toBeVisible();

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.resolved)).toBeVisible();
    await expect(ticketDetailsPage.noteInput).not.toBeVisible();
    await expect(ticketDetailsPage.saveNoteButton).not.toBeVisible();
  });
});

test.describe("Ticket close action", () => {
  test("Closing an acknowledged ticket changes its status to closed", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket to be closed for status verification",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await expect(await ticketDetailsPage.getStatus(TicketStatus.acknowledged)).toBeVisible();
    await ticketDetailsPage.closeTicket();

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.closed)).toBeVisible();
  });

  test("Closing a ticket automatically adds a status-change system note", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket to verify system note on close",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await ticketDetailsPage.closeTicket();

    // ASSERT — backend appends "Zmiana statusu: acknowledged -> closed"
    const systemNote = await ticketDetailsPage.getSpecificNote(
      "acknowledged -> closed",
    );
    await expect(systemNote).toBeVisible();
  });

  test("Close button is visible for an acknowledged ticket", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket to verify close button visibility",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.acknowledged)).toBeVisible();
    await expect(ticketDetailsPage.closeButton).toBeVisible();
  });

  test("Close button is not visible on a rejected ticket", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: ODD_SERVICE_ID,
      description: "Rejected ticket should not show close button",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.rejected)).toBeVisible();
    await expect(ticketDetailsPage.closeButton).not.toBeVisible();
  });

  test("Close button is not visible after a ticket has been closed", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    await newTicketPage.goTo();
    const createdTicket = await newTicketPage.createTicket({
      serviceId: EVEN_SERVICE_ID,
      description: "Ticket to verify close button disappears after closing",
    });

    // ACT
    await ticketDetailsPage.goTo(createdTicket.externalId!);
    await ticketDetailsPage.closeTicket();

    // ASSERT
    await expect(await ticketDetailsPage.getStatus(TicketStatus.closed)).toBeVisible();
    await expect(ticketDetailsPage.closeButton).not.toBeVisible();
  });

});
