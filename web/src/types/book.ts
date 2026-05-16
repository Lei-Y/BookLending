export interface Book {
  id: string;
  title: string;
  owner: string;
  available: boolean;
}

export type AvailabilityFilter = "All" | "Available" | "Unavailable";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BookQueryParams {
  search?: string;
  availability?: AvailabilityFilter;
  page?: number;
  pageSize?: number;
}
