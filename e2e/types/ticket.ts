export enum TicketStatus {
  new = "Nowe",
  acknowledged = "Przyjęte",
  inProgress = "W toku",
  resolved = "Rozwiązane",
  closed = "Zamknięte",
  rejected = "Odrzucone",
}

export enum ApiTicketStatus {
  new = "new",
  acknowledged = "acknowledged",
  inProgress = "inProgress",
  resolved = "resolved",
  closed = "closed",
  rejected = "rejected",
}

export enum ApiErrorCode {
  validationError = "VALIDATION_ERROR",
  statusTransitionError = "STATUS_TRANSITION_ERROR",
  noteAdditionNotAllowed = "NOTE_ADDITION_NOT_ALLOWED",
  serviceNotFound = "SERVICE_NOT_FOUND",
  troubleTicketNotFound = "TROUBLE_TICKET_NOT_FOUND",
  unauthorized = "UNAUTHORIZED",
  forbidden = "FORBIDDEN",
}

export interface ApiTicketNote {
  id: string;
  text: string;
  date: string;
}

export interface ApiTicketResponse {
  externalId: string;
  serviceId: number;
  description?: string;
  status: ApiTicketStatus;
  notes?: ApiTicketNote[];
}

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  requestId?: string;
}
