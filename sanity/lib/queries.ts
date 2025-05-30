import { defineQuery } from "next-sanity";

export const SERVICE_QUERY = defineQuery(`
*[_type == "category"]{
  _id,
  name,
  "services": *[_type == "service" && references(^._id)]{
    _id,
    name,
    price,
    duration,
    showOnline
  }
}
`);
