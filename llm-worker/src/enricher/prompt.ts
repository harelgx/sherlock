import { ErrorContext } from "../../../shared/src/types.js"

export function buildPrompt(context: ErrorContext): string {
  const { request, response, callingService, upstream, nodeError } = context;
  const { method, url, body: requestBody } = request;
  const statusCode = response?.statusCode;
  const responseBody = response?.body;

  return `You are a senior software engineering, an expert at diangosing errors. 
            A service encountered an error calling an external API. Diagnose what went wrong and explain it clearly for the on-call engineer.
            Calling service name: ${callingService}
            Full URL: ${upstream}${url}
            Method: ${method}
            Request body: ${requestBody}
            ${
              nodeError
                ? `A connection error occured. Code: ${nodeError?.code}, Message: ${nodeError?.message}`
                : `An error occured. Code: ${response?.statusCode}, Response body: ${responseBody}`
            }
            Respond in 2-3 sentences. Be specific about the likely cause and whether it's retryable.
            `;
}
