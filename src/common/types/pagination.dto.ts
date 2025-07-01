export const PaginationOptions = {
  page: 1,
  limit: 10
};

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationOptionsDto {
  page?: number;
  limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';

}