import { test, expect } from '@playwright/test';
import { NewTicketData, NewTicketPage } from '../../../pages/createTicketPage';
import { TicketsPage } from '../../../pages/ticketsPage';
import { TicketDetailsPage } from '../../../pages/ticketDetailsPage';

test.describe('Ticket creation process', () => {
  test('Full verification of ticket creation process', async ({ page }) => {
    //ARRANGE
    const newTicketPage = new NewTicketPage(page);
    const ticketDetailsPage = new TicketDetailsPage(page);
    const ticketPage = new TicketsPage(page);

    const ticketData: NewTicketData = {
      description: 'Test description for new ticket',
      note: 'Initial note for the ticket',
    };

    let createdTicketData: NewTicketData = {
      externalId: 'TT-2026-3260',
      serviceId: 100020,
      description: 'Test description for new ticket',
      note: 'Initial note for the ticket',
    };
    await test.step.skip(
      'Should create a new ticket and verify success message',
      async () => {
        //ACT
        await newTicketPage.goTo();
        await newTicketPage.createTicket(ticketData).then((data) => {
          createdTicketData = data;
          return data;
        });
        //ASSERT
        expect(await ticketDetailsPage.successMessageIsVisible()).toBe(true);
      },
    );

    await test.step('Should display the newly created ticket in the details page', async () => {
      //ACT
      await ticketDetailsPage.goTo('TT-2026-3260');
      //ASSERT
      await ticketDetailsPage.verifyTicket(createdTicketData);
    });

    await test.step('Newly created ticket visible in the tickets list', async () => {
      //ACT
      await ticketPage.goTo();
      //ASSERT
      await expect(
        ticketPage.getTicketRow(
          createdTicketData.externalId!,
          createdTicketData.serviceId!,
        ),
      ).toBeVisible();
    });
  });
});
