import { APIRequestContext } from '@playwright/test';
import { API_BASE_URL, VALID_SERVICE_ID_MIN } from '../../playwright.config';
import { bearerHeader } from './auth';
import type { TenantName } from '../../playwright.config';

export interface CreateTicketPayload {
  externalId: string;
  serviceId: number;
  description?: string;
  status?: string;
}

export interface AddNotePayload {
  text: string;
}

export interface PatchTicketPayload {
  status: string;
}

export function createApiClient(
  request: APIRequestContext,
  tenant: TenantName = 'alpha',
) {
  const defaultHeaders = bearerHeader(tenant);

  return {
    async listTickets(headers?: any) {
      return request.get(`${API_BASE_URL}/api/v1/troubleTicket`, {
        headers: { ...defaultHeaders, ...headers },
      });
    },

    async getTicket(id: string | number, headers?: any) {
      return request.get(`${API_BASE_URL}/api/v1/troubleTicket/${id}`, {
        headers: { ...defaultHeaders, ...headers },
      });
    },

    async createTicket(payload: CreateTicketPayload, headers?: any) {
      return request.post(`${API_BASE_URL}/api/v1/troubleTicket`, {
        headers: { ...defaultHeaders, ...headers },
        data: payload,
      });
    },

    async patchTicket(
      id: string | number,
      payload: PatchTicketPayload,
      headers?: any,
    ) {
      return request.patch(`${API_BASE_URL}/api/v1/troubleTicket/${id}`, {
        headers: { ...defaultHeaders, ...headers },
        data: payload,
      });
    },

    async addNote(
      ticketId: string | number,
      payload: AddNotePayload,
      headers?: any,
    ) {
      return request.post(
        `${API_BASE_URL}/api/v1/troubleTicket/${ticketId}/note`,
        {
          headers: { ...defaultHeaders, ...headers },
          data: payload,
        },
      );
    },
  };
}

export function uniqueExternalId(prefix = 'OK'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function validServiceId(): number {
  return VALID_SERVICE_ID_MIN;
}
