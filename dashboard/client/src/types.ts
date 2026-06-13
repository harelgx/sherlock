export interface ErrorContext {
  request: {
    method: string;
    url: string;
    body?: unknown;
    headers: Record<string, string>;
  };
  response?: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
  };
  nodeError?: { code: string; message: string };
  callingService: string;
  upstream: string;
  timestamp: string;
}

export interface EnrichedError {
  context: ErrorContext;
  explanation: string;
  enrichedAt: string;
}
