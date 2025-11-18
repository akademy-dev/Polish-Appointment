import "server-only";

// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity";
import { client } from "./client";
import { projectId, dataset, apiVersion } from "../env";

const { sanityFetch: originalSanityFetch, SanityLive } = defineLive({ client });

// Wrap sanityFetch with logging
export const sanityFetch = async (options: Parameters<typeof originalSanityFetch>[0]) => {
  const startTime = Date.now();
  
  // Extract query string from different possible formats
  let queryString = '';
  if (typeof options.query === 'string') {
    queryString = options.query;
  } else if (options.query && typeof options.query === 'object') {
    // Handle defineQuery result which might have query property
    queryString = (options.query as any).query || JSON.stringify(options.query);
  } else {
    queryString = String(options.query);
  }
  
  // Build the full API URL for reference
  const apiUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  
  console.log("[Sanity Fetch] Starting request:", {
    timestamp: new Date().toISOString(),
    apiUrl,
    query: queryString.substring(0, 300) + (queryString.length > 300 ? '...' : ''),
    queryLength: queryString.length,
    params: options.params,
    queryType: typeof options.query,
  });

  try {
    const result = await originalSanityFetch(options);
    const duration = Date.now() - startTime;
    
    console.log("[Sanity Fetch] Request successful:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      hasData: !!result.data,
      dataType: result.data ? typeof result.data : 'null',
      dataKeys: result.data && typeof result.data === 'object' ? Object.keys(result.data) : null,
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Extract more error details
    const errorDetails: any = {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    };
    
    // Try to extract response details if available
    if (error?.response) {
      errorDetails.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    }
    
    // Try to extract request details if available
    if (error?.request) {
      errorDetails.request = {
        url: error.request?.url || error.request?.path,
        method: error.request?.method,
        headers: error.request?.headers,
      };
    }
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorDetails.stack = error?.stack;
    }
    
    const apiUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
    
    console.error("[Sanity Fetch] Request failed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      apiUrl,
      error: errorDetails,
      query: queryString.substring(0, 300) + (queryString.length > 300 ? '...' : ''),
      params: options.params,
    });

    throw error;
  }
};

export { SanityLive };
