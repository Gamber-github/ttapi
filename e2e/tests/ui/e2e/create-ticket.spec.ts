import { test, expect } from '@playwright/test';
import { NewTicketData, NewTicketPage } from '../../../pages/createTicketPage';
import { TicketsPage } from '../../../pages/ticketsPage';
import { TicketDetailsPage } from '../../../pages/ticketDetailsPage';

test.describe('Ticket creation process', () => {
  test('Full verification of ticket creation process', async ({ page }) => {
    // ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const ticketPage = new TicketsPage(page);

    const ticketData: NewTicketData = {
      description: 'Test description for new ticket',
      note: 'Initial note for the ticket',
    };

    let createdTicketData: NewTicketData;

    await test.step('Should create a new ticket and verify success message', async () => {
      // ACT
      await newTicketPage.goTo();
      createdTicketData = await newTicketPage.createTicket(ticketData);
      // ASSERT
      await expect(ticketDetailsPage.externalId).toBeVisible();
    });

    await test.step('Should display the newly created ticket in the details page', async () => {
      // ACT
      await ticketDetailsPage.goTo(createdTicketData.externalId!);
      // ASSERT
      expect(await ticketDetailsPage.getExternalID()).toBe(
        createdTicketData.externalId,
      );
      expect(await ticketDetailsPage.getServiceID()).toBe(
        createdTicketData.serviceId,
      );
      expect(await ticketDetailsPage.getDescription()).toBe(
        createdTicketData.description,
      );

      if (ticketData.note) {
        const noteLocator = await ticketDetailsPage.getSpecificNote(
          ticketData.note,
        );
        await expect(noteLocator).toBeVisible();
      }
    });

    await test.step('Newly created ticket visible in the tickets list', async () => {
      // ACT
      await ticketPage.goTo();
      // ASSERT
      const ticketRow = ticketPage.getTicketRow(
        createdTicketData.externalId!,
        createdTicketData.serviceId!,
      );
      await expect(ticketRow).toBeVisible();
    });
  });
});
