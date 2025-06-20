import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, token } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token, // Use an environment variable for the API token
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
});
