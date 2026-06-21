import { expect, test } from "@playwright/test";
import { createApiClient } from "../../helpers/api";
import { ApiErrorCode, ApiErrorResponse } from "../../types/ticket";
import { API_BASE_URL } from "../../../playwright.config";

test.describe("Authorization", () => {
  test("should return 401 when Authorization header is missing", async ({ request }) => {
    //ACT
    const response = await request.get(`${API_BASE_URL}/api/v1/troubleTicket`);

    // ASSERT
    expect(response.status()).toBe(401);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.code).toBe(ApiErrorCode.unauthorized);
  });

  test("should return 401 when token is invalid", async ({ request }) => {
    // ARRANGE
    const api = createApiClient(request, "alpha");

    // ACT
    const response = await api.listTickets({ Authorization: "Bearer invalid.token.xyz" });

    // ASSERT
    expect(response.status()).toBe(401);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.code).toBe(ApiErrorCode.unauthorized);
  });
});
