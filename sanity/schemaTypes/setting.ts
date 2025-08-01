import { DocumentTextIcon } from "@sanity/icons";
import { defineType, defineField } from "@sanity/types";

export const setting = defineType({
  name: "setting",
  title: "Settings",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "timezone",
      title: "Timezone",
      type: "string",
      description: "The timezone for the application",
      initialValue: "UTC-7:00",
    }),
  ],
});
