export type ParseQueryResult<T> = T[] | ParseQueryResultWithCount<T>;
export type ParseQueryResultWithCount<T> = { results: T[]; count: number };
