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
  troubleTicketNotFound = "TROUBLE_TICKET_NOT_FOUND",
  notFound = "NOT_FOUND",
  forbidden = "FORBIDDEN",
  internalError = "INTERNAL_ERROR",
}
