export interface PaginationParams {
  limit: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const limit = Math.min(Number(query.limit) || 50, 200);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}
