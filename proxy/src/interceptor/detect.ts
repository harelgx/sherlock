

export function isHttpError(statusCode: number): boolean {
  return statusCode >= 400;
}

export function isConnectionError(err: unknown): boolean {
    
}