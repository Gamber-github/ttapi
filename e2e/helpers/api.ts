import { APIRequestContext } from '@playwright/test';
import { API_BASE_URL, VALID_SERVICE_ID_MIN, VALID_SERVICE_ID_MAX } from '../../playwright.config';
import { bearerHeader } from './auth';
import type { TenantName } from '../../playwright.config';
import { ApiTicketStatus } from '../types/ticket';

export interface CreateTicketPayload {
  externalId: string;
  serviceId: number;
  description?: string;
  status: ApiTicketStatus;
}

export interface AddNotePayload {
  text: string;
}

export interface PatchTicketPayload {
  status: ApiTicketStatus;
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

export function uniqueExternalId(prefix = 'API-2026'): string {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function validServiceId(): number {
  const min = VALID_SERVICE_ID_MIN % 2 === 0 ? VALID_SERVICE_ID_MIN : VALID_SERVICE_ID_MIN + 1;
  const evenCount = Math.floor((VALID_SERVICE_ID_MAX - min) / 2) + 1;
  return min + Math.floor(Math.random() * evenCount) * 2;
}

export function rejectedServiceId(): number {
  const min = VALID_SERVICE_ID_MIN % 2 !== 0 ? VALID_SERVICE_ID_MIN : VALID_SERVICE_ID_MIN + 1;
  const oddCount = Math.floor((VALID_SERVICE_ID_MAX - min) / 2) + 1;
  return min + Math.floor(Math.random() * oddCount) * 2;
}
