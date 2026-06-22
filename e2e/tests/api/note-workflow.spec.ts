import { expect, test } from "@playwright/test";
import {
  ApiClient,
  createApiClient,
  findTicketByStatus,
  rejectedServiceId,
  uniqueExternalId,
  validServiceId,
} from "../../helpers/api";
import { ApiTicketStatus, ApiTicketResponse, ApiTicketNote, ApiErrorCode, ApiErrorResponse } from "../../types/ticket";

test.describe("Note workflow", () => {
  let api!: ApiClient;

  test.beforeEach(async ({ request }) => {
    api = createApiClient(request, "alpha");
  });

  test("should return 201 when adding note to ticket in acknowledged status", async () => {
    // Arrange
    const createResponse = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: validServiceId(),
      description: "Ticket for note test",
      status: ApiTicketStatus.new,
    });
    expect(createResponse.status()).toBe(201);
    const ticket = (await createResponse.json()) as ApiTicketResponse;

    // Act
    const noteText = "Test note content";
    const noteResponse = await api.addNote(ticket.externalId, { text: noteText });
    const note = (await noteResponse.json()) as ApiTicketNote;

    // Assert
    expect(noteResponse.status()).toBe(201);
    expect(note.id).toBeDefined();
    expect(note.text).toBe(noteText);
    expect(note.date).toBeDefined();
  });

  test("should return 400 with NOTE_ADDITION_NOT_ALLOWED when adding note to rejected ticket", async () => {
    // Arrange
    const createResponse = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: rejectedServiceId(),
      description: "Ticket for note test",
      status: ApiTicketStatus.new,
    });
    expect(createResponse.status()).toBe(201);
    const ticket = (await createResponse.json()) as ApiTicketResponse;

    // Act
    const noteResponse = await api.addNote(ticket.externalId, { text: "Test note content" });
    const noteBody = (await noteResponse.json()) as ApiErrorResponse;

    // Assert
    expect(noteResponse.status()).toBe(400);
    expect(noteBody.code).toBe(ApiErrorCode.noteAdditionNotAllowed);
  });

  test("should increment note count when adding note to active ticket", async () => {
    // Arrange
    const createResponse = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: validServiceId(),
      description: "Ticket for note count test",
      status: ApiTicketStatus.new,
    });
    expect(createResponse.status()).toBe(201);
    const ticket = (await createResponse.json()) as ApiTicketResponse;
    const initialNoteCount = ticket.notes?.length ?? 0;

    // Act
    await api.addNote(ticket.externalId, { text: "Note to increment count" });

    // Assert
    const getResponse = await api.getTicket(ticket.externalId);
    const updatedTicket = (await getResponse.json()) as ApiTicketResponse;
    expect(updatedTicket.notes?.length ?? 0).toBe(initialNoteCount + 1);
  });

  test("should return 400 with NOTE_ADDITION_NOT_ALLOWED when adding note to resolved ticket", async () => {
    // Arrange — resolved status is set by the system, not reachable via client API; use predefined data
    const resolvedTicket = await findTicketByStatus(api, ApiTicketStatus.resolved);
    if (!resolvedTicket) {
      test.skip(true, "No resolved ticket found — status is system-managed");
      return;
    }

    // Act
    const noteResponse = await api.addNote(resolvedTicket!.externalId, { text: "Note on resolved ticket" });
    const noteBody = (await noteResponse.json()) as ApiErrorResponse;

    // Assert
    expect(noteResponse.status()).toBe(400);
    expect(noteBody.code).toBe(ApiErrorCode.noteAdditionNotAllowed);
  });

  test("should return 400 with NOTE_ADDITION_NOT_ALLOWED when adding note to closed ticket", async () => {
    // Arrange
    const createResponse = await api.createTicket({
      externalId: uniqueExternalId(),
      serviceId: validServiceId(),
      description: "Ticket for closed note test",
      status: ApiTicketStatus.new,
    });
    expect(createResponse.status()).toBe(201);
    const ticket = (await createResponse.json()) as ApiTicketResponse;

    const patchResponse = await api.patchTicket(ticket.externalId, { status: ApiTicketStatus.closed });
    expect(patchResponse.status()).toBe(200);

    // Act
    const noteResponse = await api.addNote(ticket.externalId, { text: "Note on closed ticket" });
    const noteBody = (await noteResponse.json()) as ApiErrorResponse;

    // Assert
    expect(noteResponse.status()).toBe(400);
    expect(noteBody.code).toBe(ApiErrorCode.noteAdditionNotAllowed);
  });
});
