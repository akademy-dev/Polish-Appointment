import { defineQuery } from "next-sanity";

export const SERVICES_QUERY = defineQuery(`
*[_type == "service" && ($categoryId == "" || category._ref == $categoryId) && ($searchTerm == "" || name match $searchTerm + "*")]{
  _id,
  name,
  price,
  duration,
  showOnline,
  category -> {
    _ref,
    _type,
    name
  }
} | order(_id asc) [($page - 1) * $limit ... $page * $limit]
`);

export const TOTAL_SERVICES_QUERY = defineQuery(
  `count(*[_type == "service" && ($categoryId == "" || category._ref == $categoryId) && ($searchTerm == "" || name match $searchTerm + "*")])`
);

export const CATEGORIES_QUERY = `*[_type == "category"]{_id, name} | order(name asc)`;

export const EMPLOYEES_QUERY = defineQuery(
  `{
    "data": *[_type == "employee" && (!defined($search) || firstName match $search || lastName match $search || (firstName + " " + lastName) match $search || position match $search || phone match $search)]{
      _id,
      _type,
      firstName,
      lastName,
      _createdAt,
      phone,
      position,
      workingTimes,
      timeOffSchedules,
    } | order(_createdAt desc) [($page - 1) * $limit ... $page * $limit],
    "total": count(*[_type == "employee" && (!defined($search) || firstName match $search || lastName match $search || (firstName + " " + lastName) match $search || position match $search || phone match $search)])
  }`
);

export const CUSTOMERS_QUERY = defineQuery(
  `{
    "data": *[_type == "customer" && (!defined($search) || firstName match $search || lastName match $search || (firstName + " " + lastName) match $search || phone match $search || email match $search)]{
      _id,
      _type,
      firstName,
      lastName,
      _createdAt,
      phone
    } | order(_createdAt desc) [($page - 1) * $limit ... $page * $limit],
    "total": count(*[_type == "customer" && (!defined($search) || firstName match $search || lastName match $search || (firstName + " " + lastName) match $search || phone match $search || email match $search)])
  }`
);
