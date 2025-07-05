import { defineQuery } from "next-sanity";

export const SERVICES_QUERY = defineQuery(`
{
"data": 
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
} | order(_id asc) [($page - 1) * $limit ... $page * $limit],
"total": count(*[_type == "service" && ($categoryId == "" || category._ref == $categoryId) && ($searchTerm == "" || name match $searchTerm + "*")])
}
`);

export const All_SERVICES_QUERY = defineQuery(`
*[_type == "service" && showOnline == true]{
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
}
`);

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
  }`,
);

export const APPOINTMENTS_QUERY = defineQuery(
  `{
    "data": *[_type == "appointment"  
     && ($status == "" || status == $status)
     && ($searchTerm == "" || !defined($searchTerm) || customer->firstName match "*" + $searchTerm + "*" || customer->lastName match "*" + $searchTerm + "*" || (customer->firstName + " " + customer->lastName) match "*" + $searchTerm + "*" || employee->firstName match "*" + $searchTerm + "*" || employee->lastName match "*" + $searchTerm + "*" || service->name match "*" + $searchTerm + "*")]{
      _id,
      startTime,
      endTime,
      duration,
      customer -> {
        _id,
        firstName,
        lastName,
        "fullName": firstName + " " + lastName
      },
      employee -> {
        _id,
        firstName,
        lastName,
        "fullName": firstName + " " + lastName
      },
      note,
      reminder,
      service -> {
        _id,
        name,
        duration
      },
      status
    } | order(startTime asc) [($page - 1) * $limit ... $page * $limit],
    "total": count(*[_type == "appointment" 
     && ($status == "" || status == $status)
     && ($searchTerm == "" || !defined($searchTerm) || customer->firstName match "*" + $searchTerm + "*" || customer->lastName match "*" + $searchTerm + "*" || (customer->firstName + " " + customer->lastName) match "*" + $searchTerm + "*" || employee->firstName match "*" + $searchTerm + "*" || employee->lastName match "*" + $searchTerm + "*" || service->name match "*" + $searchTerm + "*")])
}`,
);

export const ALL_EMPLOYEES_QUERY = defineQuery(
  `*[_type == "employee" && (!defined($search) || firstName match $search || lastName match $search || position match $search || phone match $search)] | order(_createdAt desc){
      _id,
      _type,
      firstName,
      lastName,
      _createdAt,
      phone,
      position,
      workingTimes,
      timeOffSchedules
  }`,
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
  }`,
);

export const ALL_CUSTOMERS_QUERY = defineQuery(
  `
    *[_type == "customer" && (!defined($search) || firstName match $search || lastName match $search || (firstName + " " + lastName) match $search || phone match $search || email match $search)]{
      _id,
      _type,
      firstName,
      lastName,
      _createdAt,
      phone
    }
  `,
);

export const APPOINTMENTS_BY_DATE_QUERY = defineQuery(
  `
*[_type == "appointment" 
&& ($date == null || (
    dateTime(startTime) >= dateTime($date + "T00:00:00.000Z") 
    && dateTime(startTime) < dateTime($date + "T23:59:59.999Z")
  )) 
  && (!defined($customerId) || customer._ref == $customerId)] {
  _id,
  startTime,
  endTime,
  duration,
  customer -> {
  _id,
  firstName,
  lastName
  },
  employee -> {
  _id,
  firstName,
  lastName,
  },
  note,
  reminder,
  service -> {
    _id,
    name,
    duration
  },
  status
}
`,
);

export const APPOINTMENTS_BY_EMPLOYEE_QUERY = defineQuery(
  `*[_type == "appointment"
  && employee._ref == $employeeId] {
  _id,
  startTime,
  endTime,
  duration,
  customer -> {
    _id,
    firstName,
    lastName,
     "fullName": firstName + " " + lastName
  },
  employee -> {
    _id,
    firstName,
    lastName,
   
  },
  service -> {
    _id,
    name,
    duration
  }
} | order(startTime asc)`,
);

export const APPOINTMENTS_BY_CUSTOMER_QUERY = defineQuery(
  `*[_type == "appointment"
  && customer._ref == $customerId] {
  _id,
  startTime,
  endTime,
  duration,
  customer -> {
    _id,
    firstName,
    lastName, 
    
  },
  employee -> {
    _id,
    firstName,
    lastName,
    "fullName": firstName + " " + lastName
  },
  service -> {
    _id,
    name,
    duration
  }
} | order(startTime asc)`,
);
