import { expect, test } from "@playwright/test";
import { createApiClient, uniqueExternalId, validServiceId } from "../../helpers/api";
import { ApiTicketStatus, ApiTicketResponse } from "../../types/ticket";

test.describe("Tenant isolation", () => {
  test("should receive 404 for accessing other tenant ticket", async ({ request }) => {
    // Arrange
    const betaApiClient = createApiClient(request, "beta");
    const gammaApiClient = createApiClient(request, "gamma");
    const externalId = uniqueExternalId();

    // Act
    const betaResponse = await betaApiClient.createTicket({
      externalId,
      serviceId: validServiceId(),
      description: "Ticket visible only for beta tenant",
      status: ApiTicketStatus.new,
    });
    const betaBody = (await betaResponse.json()) as ApiTicketResponse;

    const gammaResponse = await gammaApiClient.listTickets();
    const gammaBody = (await gammaResponse.json()) as ApiTicketResponse[];
    const found = gammaBody.find((t) => t.externalId === externalId);

    // Assert
    expect(betaResponse.status()).toBe(201);
    expect(betaBody.externalId).toBe(externalId);

    expect(found).toBeUndefined();
  });
});
