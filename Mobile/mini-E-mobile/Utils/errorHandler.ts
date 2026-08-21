import axios, { AxiosError, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Custom Error class for API and Application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public success: boolean;
  public rawData?: any;

  constructor(message: string, statusCode = 500, rawData?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.success = false;
    this.rawData = rawData;

    // Restore prototype chain for custom Error inheritance in TS
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Central Error Handler Function
 * Normalizes any error (Network, API response, syntax, JS Exception) into a standardized AppError.
 */
export function handleCentralError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Axios Errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    
    // Network or Connection errors (e.g. no internet)
    if (!axiosError.response) {
      return new AppError('Network connection error. Please check your internet connection.', 0, axiosError);
    }

    // Backend returned an error response
    const status = axiosError.response.status;
    const resData = axiosError.response.data;
    
    const errorMessage = resData?.message || `Request failed with status code ${status}`;
    return new AppError(errorMessage, status, resData);
  }

  if (error instanceof Error) {
    return new AppError(error.message || 'An unexpected error occurred.', 500, error);
  }

  return new AppError('An unknown error occurred.', 500, error);
}

/**
 * Centralized axios response handler used by all service modules.
 * Extracts the backend response data directly on success.
 */
export async function handleApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): Promise<T> {
  const resData = response.data;

  // Even if HTTP status is 200, the backend might return success === false
  if (resData.success === false) {
    const errorMessage = resData.message || `Request failed with status code ${response.status}`;
    throw new AppError(errorMessage, response.status, resData);
  }

  return resData.data as T;
}
