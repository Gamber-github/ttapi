import { test, expect } from "@playwright/test";
import { NewTicketData, NewTicketPage } from "../../../pages/createTicketPage";
import { TicketsPage } from "../../../pages/ticketsPage";
import { TicketDetailsPage } from "../../../pages/ticketDetailsPage";
import { TicketStatus } from "../../../types/ticket";

test.describe("Ticket creation process", () => {
  test("Full verification of ticket creation process", async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const ticketPage = new TicketsPage(page);

    const ticketData: NewTicketData = {
      description: "Test description for new ticket",
      note: "Initial note for the ticket",
    };

    let createdTicketData: NewTicketData;

    await test.step("Should create a new ticket and verify success message", async () => {
      // ACT
      await newTicketPage.goTo();
      createdTicketData = await newTicketPage.createTicket(ticketData);
      // ASSERT
      await expect(ticketDetailsPage.externalId).toBeVisible();
    });

    await test.step("Should display the newly created ticket in the details page", async () => {
      // ACT
      await ticketDetailsPage.goTo(createdTicketData.externalId!);
      // ASSERT
      expect(await ticketDetailsPage.getExternalID()).toBe(createdTicketData.externalId);
      expect(await ticketDetailsPage.getServiceID()).toBe(createdTicketData.serviceId);
      expect(await ticketDetailsPage.getDescription()).toBe(createdTicketData.description);

      if (ticketData.note) {
        const noteLocator = await ticketDetailsPage.getSpecificNote(ticketData.note);
        await expect(noteLocator).toBeVisible();
      }
    });

    await test.step("Newly created ticket visible in the tickets list", async () => {
      // ACT
      await ticketPage.goTo();
      // ASSERT
      const ticketRow = ticketPage.getTicketRow(createdTicketData.externalId!, createdTicketData.serviceId!);
      await expect(ticketRow).toBeVisible();
    });
  });
});

test.describe("Ticket creation walidation", () => {
  test("Creating a ticket with inpropper serviceID for any tenant", async ({ page }) => {
    //Arrange
    const newTicket = new NewTicketPage(page);
    const ticketDetails = new TicketDetailsPage(page);
    const ticketData: NewTicketData = {
      serviceId: 99999,
      description: "Test description for new ticket",
      note: "Initial note for the ticket",
    };
    //Act
    await newTicket.goTo();
    await newTicket.createTicket(ticketData);
    //Assert
    await expect(ticketDetails.externalId).toBeVisible();
    await expect(await ticketDetails.getStatus(TicketStatus.rejected)).toHaveText(TicketStatus.rejected);
  });
});
