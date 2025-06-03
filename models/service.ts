import type { Service as SanityService } from "@/sanity/types";

export type Service = SanityService;

export const getServiceId = (service: Service): string => {
  return service._id;
};
