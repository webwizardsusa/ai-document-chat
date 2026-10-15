/** Shared error helpers — keep RTK / fetch error wording consistent. */

/** RTK Query errors put the message on `error.data` (string). */
export const getErrorMessage = (err: unknown, fallback = 'Request failed'): string => {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data: unknown }).data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
  }
  return fallback;
};

/** Read `{ message }` from a failed API Response body. */
export const readResponseError = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string };
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  } catch {
    // non-JSON body
  }
  return fallback;
};
