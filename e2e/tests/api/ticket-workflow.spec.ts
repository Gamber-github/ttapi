import { expect, test } from "@playwright/test";
import { createApiClient, rejectedServiceId, uniqueExternalId, validServiceId } from "../../helpers/api";
import { ApiErrorCode, ApiTicketStatus, ApiTicketResponse, ApiErrorResponse } from "../../types/ticket";

type ApiClient = ReturnType<typeof createApiClient>;

async function assertIdempotentCreation(
  api: ApiClient,
  externalId: string,
  firstServiceId: number,
  secondServiceId: number
): Promise<void> {
  // Act - create first ticket
  const firstResponse = await api.createTicket({
    externalId,
    serviceId: firstServiceId,
    description: "Original ticket",
    status: ApiTicketStatus.new,
  });
  expect(firstResponse.status()).toBe(201);
  const firstBody = (await firstResponse.json()) as ApiTicketResponse;

  // Act - create duplicate ticket
  const secondResponse = await api.createTicket({
    externalId,
    serviceId: secondServiceId,
    description: "Different description",
    status: ApiTicketStatus.new,
  });
  const secondBody = (await secondResponse.json()) as ApiTicketResponse;

  // Assert
  expect(secondResponse.status()).toBe(200);
  expect(secondBody.serviceId).toBe(firstBody.serviceId);
  expect(secondBody.description).toBe(firstBody.description);
  expect([ApiTicketStatus.new, ApiTicketStatus.acknowledged]).toContain(secondBody.status);
}

test.describe("Ticket workflow", () => {
  let api!: ApiClient;

  test.beforeEach(async ({ request }) => {
    api = createApiClient(request, "alpha");
  });

  test("should return 201 with new or acknowledged status on valid ticket creation", async () => {
    // Act
    const response = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: validServiceId(),
      description: "Test ticket API-2026",
      status: ApiTicketStatus.new,
    });
    const body = (await response.json()) as ApiTicketResponse;

    // Assert
    expect(response.status()).toBe(201);
    expect(body.externalId).toBeDefined();
    expect([ApiTicketStatus.new, ApiTicketStatus.acknowledged]).toContain(body.status);
  });

  test("should return 400 with VALIDATION_ERROR when serviceId is missing", async () => {
    // Act
    const response = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: undefined as any,
      description: "Invalid ticket",
    });
    const body = (await response.json()) as ApiErrorResponse;

    // Assert
    expect(response.status()).toBe(400);
    expect(body.code).toBe(ApiErrorCode.validationError);
  });

  test("should create ticket with rejected status and return 201 when serviceId is outside valid range", async () => {
    // Act
    const response = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: rejectedServiceId(),
      description: "Ticket with Rejected status",
      status: ApiTicketStatus.new,
    });
    const body = (await response.json()) as ApiTicketResponse;

    // Assert
    expect(response.status()).toBe(201);
    expect(body.externalId).toBeDefined();
    expect(body.status).toBe(ApiTicketStatus.rejected);
  });

  test("should return 200 with original ticket data and valid status on duplicate externalId with different serviceId", async () => {
    // Act & Assert
    await assertIdempotentCreation(api, uniqueExternalId(), validServiceId(), rejectedServiceId());
  });

  test("should return 200 with original ticket data and valid status on duplicate externalId and serviceId", async () => {
    // Arrange
    const serviceId = validServiceId();

    // Act & Assert
    await assertIdempotentCreation(api, uniqueExternalId(), serviceId, serviceId);
  });
});
