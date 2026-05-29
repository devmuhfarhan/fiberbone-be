export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}

export const formatSuccess = <T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> => {
  return {
    success: true,
    data,
    error: null,
    ...(meta && { meta })
  };
};

export const formatError = (error: string): ApiResponse<null> => {
  return {
    success: false,
    data: null,
    error
  };
};
