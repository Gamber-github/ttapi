import { test, expect } from "@playwright/test";
import { NewTicketData, NewTicketPage } from "../../pages/createTicketPage";
import { TicketsPage } from "../../pages/ticketsPage";
import { TicketDetailsPage } from "../../pages/ticketDetailsPage";
import { TicketStatus } from "../../types/ticket";

test.describe("Ticket creation process", () => {
  test("Full verification of ticket creation process", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const ticketPage = new TicketsPage(page);

    const ticketData: NewTicketData = {
      description: "Test description for new ticket",
      initialNote: "Initial note for the ticket",
    };

    let createdTicketData: NewTicketData;

    await test.step("Should create a new ticket and navigate to details page", async () => {
      // ACT
      await newTicketPage.goTo();
      createdTicketData = await newTicketPage.createTicket(ticketData);
      // ASSERT
      await expect(ticketDetailsPage.externalId).toBeVisible();
    });

    await test.step("Should display correct ticket data and accept an initial note", async () => {
      // ACT
      await ticketDetailsPage.goTo(createdTicketData.externalId!);
      // ASSERT
      expect(await ticketDetailsPage.getExternalID()).toBe(createdTicketData.externalId);
      expect(await ticketDetailsPage.getServiceID()).toBe(createdTicketData.serviceId);
      expect(await ticketDetailsPage.getDescription()).toBe(createdTicketData.description);

      const noteLocator = await ticketDetailsPage.getSpecificNote(createdTicketData.initialNote!);
      await expect(noteLocator).toBeVisible();
    });

    await test.step("Newly created ticket should be visible in the tickets list", async () => {
      // ACT
      await ticketPage.goTo();
      // ASSERT
      const ticketRow = ticketPage.getTicketRow(createdTicketData.externalId!, createdTicketData.serviceId!);
      await expect(ticketRow).toBeVisible();
    });
  });
});

test.describe("Ticket creation idempotency", () => {
  test("Submitting the same externalId twice returns the existing ticket instead of creating a new one", async ({
    page,
  }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);

    const ticketData: NewTicketData = {
      externalId: newTicketPage.generateExternalId("IDEM-2026-"),
      description: "Original ticket description",
    };

    // ACT — first submission creates the ticket
    await newTicketPage.goTo();
    const firstResult = await newTicketPage.createTicket(ticketData);
    await expect(ticketDetailsPage.externalId).toBeVisible();
    const firstDescription = await ticketDetailsPage.getDescription();

    // ACT — second submission with the same externalId but different description
    await newTicketPage.goTo();
    await newTicketPage.createTicket({
      externalId: firstResult.externalId,
      description: "This description should never be saved",
    });

    // ASSERT — lands on the same ticket with the original description (existing resource returned)
    await expect(ticketDetailsPage.externalId).toBeVisible();
    expect(await ticketDetailsPage.getExternalID()).toBe(firstResult.externalId);
    expect(await ticketDetailsPage.getDescription()).toBe(firstDescription);
  });
});

test.describe("Ticket creation validation", () => {
  test("Creating a ticket with improper serviceId results in rejected status", async ({ page }) => {
    // ARRANGE
    const newTicket = new NewTicketPage(page);
    const ticketDetails = new TicketDetailsPage(page);

    // ACT
    await newTicket.goTo();
    await newTicket.createTicket({
      serviceId: 999999,
      description: "Test description for rejected ticket",
    });

    // ASSERT
    await expect(ticketDetails.externalId).toBeVisible();
    await expect(await ticketDetails.getStatus(TicketStatus.rejected)).toBeVisible();
  });
});
