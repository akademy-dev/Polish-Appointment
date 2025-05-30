import { type SchemaTypeDefinition } from "sanity";
import { serviceType } from "@/sanity/schemaTypes/service";
import { categoryType } from "@/sanity/schemaTypes/category";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [serviceType, categoryType],
};
