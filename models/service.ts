import { Category } from "@/models/category";

export type Service = {
  _id: string;
  name: string;
  showOnline: boolean;
  price: number;
  duration: number;
  category: Category;
};
