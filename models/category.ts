import { Service } from "@/models/service";

export type Category = {
  _id: string;
  name: string;
  services: Service[];
};
