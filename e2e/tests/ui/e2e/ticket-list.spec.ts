import { test, expect } from '@playwright/test';
import { TicketsPage } from '../../../pages/ticketsPage';

test.describe('Ticket List', () => {
  test('Should display the ticket list', async ({ page }) => {
    //ARRANGE
    const ticketListPage = new TicketsPage(page);
    //ACT
    await ticketListPage.goTo();
    //ASSERT
    await expect(ticketListPage.table).toBeVisible();
  });

  test('Should open ticket details', async ({ page }) => {
    //ARRANGE
    const ticketListPage = new TicketsPage(page);
    const testTicket = {
      externalId: 'TT-2026-0001',
      tenantId: 100001,
    };
    //ACT
    await ticketListPage.goTo();
    await ticketListPage.OpenTicketDetails(
      testTicket.externalId,
      testTicket.tenantId,
    );
    //ASSERT
    await expect(
      page.getByRole('heading', { name: testTicket.externalId }),
    ).toBeVisible();
  });
});
