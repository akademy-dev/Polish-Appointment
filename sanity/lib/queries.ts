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

export const ALL_SERVICES_QUERY = defineQuery(`
*[_type == "service" && showOnline == true]{
  _id,
  name,
  price,
  duration,
  showOnline,
  category -> {
    _id,
    name
  }
}`);

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
      note,
      workingTimes,
      timeOffSchedules,
      assignedServices,
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
      reminder,
      type,
      service -> {
        _id,
        name,
        duration
      },
      status,
      recurringGroupId
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
      note,
      workingTimes,
      timeOffSchedules,
      assignedServices
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
      phone,
      note
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
      phone,
      note
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
  _createdAt,
  startTime,
  endTime,
  duration,
  customer -> {
    _id,
    firstName,
    lastName,
    "fullName": firstName + " " + lastName,
  },
  employee -> {
    _id,
    firstName,
    lastName,
    "fullName": firstName + " " + lastName
  },
  reminder,
  type,
  smsMessage,
  service -> {
    _id,
    name,
    duration
  },
  status,
  note,
  recurringGroupId
}
`,
);

export const APPOINTMENT_TIME_OFF_QUERY = defineQuery(
  `*[_type == "appointmentTimeOff"] {
  _id,
  _createdAt,
  _updatedAt,
  employee->{
    _id,
    firstName,
    lastName,
    phone
  },
  startTime,
  duration,
  reason,
  isRecurring,
  recurringDuration,
  recurringFrequency
}`,
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
  },
  status,
  recurringGroupId
} | order(startTime asc)`,
);

export const SEND_SMS_QUERY = defineQuery(
  `*[_type == "appointment" && status == "scheduled" && count(reminderDateTimes[@ >= $startTime && @ <= $endTime]) > 0] {
    _id,
    startTime,
    endTime,
    duration,
    customer -> {
      _id,
      firstName,
      lastName,
      phone
    },
    employee -> {
      _id,
      firstName,
      lastName
    },
    service -> {
      _id,
      name
    },
    smsMessage,
    "isFirst": startTime == *[_type == "appointment" && status == "scheduled" && customer._ref == ^.customer._ref && array::join(string::split(startTime, "")[0..9], "") == array::join(string::split(^.startTime, "")[0..9], "")] | order(startTime asc)[0].startTime
  }[isFirst == true] | order(startTime asc)
  `,
);

export const UPDATE_APPOINTMENT_STATUS_QUERY = defineQuery(
  `*[_type == "appointment" && status == "scheduled" && endTime < $date] 
  {     
  _id,     
  status   
  }`,
);

export const CHECK_CONFLICT_QUERY = defineQuery(
  `*[_type == "appointment" 
    && status == "scheduled" 
    && employee._ref == $employeeId
    && (
      (dateTime(startTime) >= dateTime($startTime) && dateTime(startTime) < dateTime($endTime)) ||
      (dateTime(endTime) > dateTime($startTime) && dateTime(endTime) <= dateTime($endTime)) ||
      (dateTime(startTime) <= dateTime($startTime) && dateTime(endTime) >= dateTime($endTime))
    )
  ] {
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
    service -> {
      _id,
      name,
      duration
    },
    status
  } | order(startTime asc)`,
);

export const EMPLOYEE_WORKING_TIMES_QUERY = defineQuery(
  `*[_type == "employee" && _id == $employeeId] {
    _id,
    firstName,
    lastName,
    workingTimes[] {
      day,
      from,
      to
    },
    timeOffSchedules[] {
      period,
      date,
      from,
      to,
      reason,
      dayOfWeek,
      dayOfMonth
    }
  }[0]`,
);

export const TIMEZONE_QUERY = defineQuery(
  `*[_type == "setting"][0]{
  _id,
  timezone,
  "minTime": coalesce(minTime, "8:00 AM"),
  "maxTime": coalesce(maxTime, "6:00 PM"),
  smsMessage
}`,
);

export const TIME_TRACKING_QUERY = defineQuery(
  `*[_type == "timeTracking"] | order(checkIn desc) {
  _id,
  employee->{
    _id,
    firstName,
    lastName
  },
  checkIn,
  checkOut,
  hourlyRate,
  totalHours,
  totalPay,
  note,
  status,
  _createdAt,
  _updatedAt
}`
);

export const TIME_TRACKING_BY_DATE_RANGE_QUERY = defineQuery(
  `*[_type == "timeTracking" && 
  checkIn >= $startDate && 
  checkIn <= $endDate
] | order(checkIn desc) {
  _id,
  employee->{
    _id,
    firstName,
    lastName
  },
  checkIn,
  checkOut,
  hourlyRate,
  totalHours,
  totalPay,
  note,
  status,
  _createdAt,
  _updatedAt
}`
);

export const TIME_TRACKING_BY_EMPLOYEE_QUERY = defineQuery(
  `*[_type == "timeTracking" && 
  employee._ref == $employeeId
] | order(checkIn desc) {
  _id,
  employee->{
    _id,
    firstName,
    lastName
  },
  checkIn,
  checkOut,
  hourlyRate,
  totalHours,
  totalPay,
  note,
  status,
  _createdAt,
  _updatedAt
}`
);
