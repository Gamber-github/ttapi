import { expect, test } from "@playwright/test";
import { createApiClient, rejectedServiceId, uniqueExternalId, validServiceId } from "../../helpers/api";
import { ApiErrorCode, ApiTicketStatus } from "../../types/ticket";

test.describe("Ticket workflow", () => {
  test("should create ticket and return new or acknowledge status", async ({ request }) => {
    // Arrange
    const api = createApiClient(request, "alpha");

    // ACT
    const response = await api.createTicket({
      externalId: uniqueExternalId("API-2026"),
      serviceId: validServiceId(),
      description: "Test ticket API-2026",
      status: ApiTicketStatus.new,
    });
    const body = await response.json();

    //ASSERT
    expect(response.status()).toBe(201);
    expect(body.externalId).toBeDefined();
    expect([ApiTicketStatus.new, ApiTicketStatus.acknowledged]).toContain(body.status);
  });

  test("should return validation error when serviceId is missing", async ({ request }) => {
    // ARRANGE
    const api = createApiClient(request, "alpha");

    // ACT
    const response = await api.createTicket({
      externalId: uniqueExternalId("API-2026"),
      serviceId: undefined as any,
      description: "Invalid ticket",
    });

    const body = await response.json();

    // ASSERT
    expect(response.status()).toBe(400);
    expect(body.code).toBe(ApiErrorCode.validationError);
  });

  test("should create ticket with rejected status", async ({ request }) => {
    // ARRANGE
    const api = createApiClient(request, "alpha");

    // ACT
    const response = await api.createTicket({
      externalId: uniqueExternalId("API-2026"),
      serviceId: rejectedServiceId(),
      description: "Ticket with Rejected status",
      status: ApiTicketStatus.new,
    });

    const body = await response.json();

    // ASSERT
    expect(response.status()).toBe(201);
    expect(body.externalId).toBeDefined();
    expect(body.status).toBe(ApiTicketStatus.rejected);
  });
});
