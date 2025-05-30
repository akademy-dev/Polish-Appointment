import { defineQuery } from "next-sanity";

export const SERVICES_QUERY = defineQuery(`
*[_type == "service" && ($categoryId == "" || category._ref == $categoryId) && ($searchTerm == "" || name match $searchTerm + "*")]{
  _id,
  name,
  price,
  duration,
  showOnline,
  category -> {
    _id,
    name
  }
} | order(_id asc) [($page - 1) * $limit ... $page * $limit]
`);

export const TOTAL_SERVICES_QUERY = defineQuery(`
count(*[_type == "service" && ($categoryId == "" || category._ref == $categoryId) && ($searchTerm == "" || name match $searchTerm + "*")])`);

export const CATEGORIES_QUERY = `*[_type == "category"]{_id, name} | order(name asc)`;
