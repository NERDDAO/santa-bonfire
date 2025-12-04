/**
 * Error utilities for API response handling
 */

export interface ApiError {
  message: string;
  details?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Create a structured error object from a fetch Response
 * @param response - The fetch Response object
 * @returns ApiError object with message and optional details
 */
export async function createErrorFromResponse(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let details: string | undefined;

  try {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const errorData = await response.json();
      message = errorData.error || errorData.message || errorData.detail || message;
      details = errorData.details || errorData.trace || JSON.stringify(errorData);
    } else {
      const text = await response.text();
      if (text) {
        message = text.slice(0, 200); // Limit message length
        details = text;
      }
    }
  } catch {
    // If parsing fails, use default message
    details = "Failed to parse error response";
  }

  return {
    message,
    details,
    status: response.status,
    statusCode: response.status,
  };
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}
