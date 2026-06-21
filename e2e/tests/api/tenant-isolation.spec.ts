import { expect, test } from "@playwright/test";
import { createApiClient, uniqueExternalId, validServiceId } from "../../helpers/api";
import { ApiErrorCode, ApiTicketStatus, ApiTicketResponse, ApiErrorResponse } from "../../types/ticket";

test.describe("Tenant isolation", () => {
  test("should receive 404 for accessing other tenant ticket", async ({ request }) => {
    // ARRANGE
    const betaApiClient = createApiClient(request, "beta");
    const gammaApiClient = createApiClient(request, "gamma");
    const externalID = uniqueExternalId();
    const serviceID = validServiceId();

    // ACT
    const responseForBeta = await betaApiClient.createTicket({
      externalId: externalID,
      serviceId: serviceID,
      description: "Ticket visible only for beta tenant",
      status: ApiTicketStatus.new,
    });
    const betaBody = (await responseForBeta.json()) as ApiTicketResponse;

    const responseForGamma = await gammaApiClient.getTicket(externalID);
    const gammaBody = (await responseForGamma.json()) as ApiErrorResponse;

    // ASSERT
    expect(responseForBeta.status()).toBe(201);
    expect(betaBody.externalId).toBe(externalID);

    expect(responseForGamma.status()).toBe(404);
    expect(gammaBody.code).toBe(ApiErrorCode.troubleTicketNotFound);
  });
});
