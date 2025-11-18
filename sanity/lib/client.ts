import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, token } from "../env";

// Log client configuration
console.log("[Sanity Client] Initializing client with config:", {
  projectId,
  dataset,
  apiVersion,
  hasToken: !!token,
  useCdn: false,
  apiUrl: `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
});

const baseClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token, // Use an environment variable for the API token
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
});

// Wrap client.fetch with logging
const originalFetch = baseClient.fetch.bind(baseClient);
baseClient.fetch = async (query: any, params?: any) => {
  const startTime = Date.now();
  
  // Extract query string
  let queryString = '';
  if (typeof query === 'string') {
    queryString = query;
  } else if (query && typeof query === 'object') {
    queryString = (query as any).query || JSON.stringify(query);
  } else {
    queryString = String(query);
  }
  
  const apiUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  
  console.log("[Sanity Client Fetch] Starting request:", {
    timestamp: new Date().toISOString(),
    apiUrl,
    query: queryString.substring(0, 300) + (queryString.length > 300 ? '...' : ''),
    queryLength: queryString.length,
    params: params || {},
  });

  try {
    const result = await originalFetch(query, params);
    const duration = Date.now() - startTime;
    
    console.log("[Sanity Client Fetch] Request successful:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      hasResult: !!result,
      resultType: result ? typeof result : 'null',
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    const errorDetails: any = {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    };
    
    if (error?.response) {
      errorDetails.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };
    }
    
    if (process.env.NODE_ENV === 'development') {
      errorDetails.stack = error?.stack;
    }
    
    console.error("[Sanity Client Fetch] Request failed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      apiUrl,
      error: errorDetails,
      query: queryString.substring(0, 300) + (queryString.length > 300 ? '...' : ''),
      params: params || {},
    });

    throw error;
  }
};

export const client = baseClient;
