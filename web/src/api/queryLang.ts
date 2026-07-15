import api from './axios';

export interface HqlDocument {
  id: string;
  title: string;
  type: 'contract' | 'other';
  name: string;
  ownerId: string;
  signers?: string[];
  status: 'draft' | 'pending' | 'signed' | 'archived' | 'refused';
  gridfsId?: string;
  announcementId?: string;
  createdAt: string;
}

export interface QueryLangResult {
  collection: string;
  filter: Record<string, unknown>;
  count: number;
  results: HqlDocument[];
  tookMs: number;
}

export const queryLangApi = {
  execute: (query: string) =>
    api.post<QueryLangResult>('/query-lang/execute', { query }),
  getDocumentFile: (id: string) =>
    api.get<Blob>(`/documents/${id}/file`, { responseType: 'blob' }),
};
