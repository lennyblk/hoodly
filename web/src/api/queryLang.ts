import api from './axios';

export interface QueryLangResult {
  collection: string;
  filter: Record<string, unknown>;
  count: number;
  results: unknown[];
  tookMs: number;
}

export const queryLangApi = {
  execute: (query: string) =>
    api.post<QueryLangResult>('/query-lang/execute', { query }),
};
