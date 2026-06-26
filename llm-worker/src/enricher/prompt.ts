import { ErrorContext } from "../../../shared/src/types.js"

export function buildPrompt(context: ErrorContext): string {
  const { request, response, callingService, upstream, nodeError } = context;
  const { method, url, body: requestBody } = request;
  const statusCode = response?.statusCode;
  const responseBody = response?.body;

  const errorDetails = nodeError
    ? `A connection error occurred. Code: ${nodeError?.code}, Message: ${nodeError?.message}`
    : `An error occurred. Status: ${statusCode}, Response body: ${responseBody}`;

  return `You are a senior software engineer expert at diagnosing API errors.
          A service encountered an error calling an external API. Diagnose what went wrong.

          Calling service: ${callingService}
          Full URL: ${upstream}${url}
          Method: ${method}
          Request body: ${JSON.stringify(requestBody)}
          ${errorDetails}

          Be specific and concise. 
        `;
}