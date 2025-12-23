import ProfileList from "@/components/profiles/ProfileList";
import { getEmployees } from "@/data/employee";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_ITEMS_PER_PAGE = 20;

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; limit?: string }>;
}) => {
  const { query, page: pageString, limit: limitString } = await searchParams;
  const currentPage = parseInt(pageString || "1", 10);
  const itemsPerPage = parseInt(
    limitString || String(DEFAULT_ITEMS_PER_PAGE),
    10,
  );

  const employeesResult = await getEmployees({
    search: query || "",
    page: currentPage,
    limit: itemsPerPage,
  });

  // Transform employees to match expected format
  const employeesFormatted = employeesResult.data.map((emp) => ({
    _id: emp.id,
    _type: "employee",
    firstName: emp.first_name,
    lastName: emp.last_name,
    phone: emp.phone,
    position: emp.position,
    note: emp.note,
    _createdAt: emp.created_at,
    workingTimes: emp.workingTimes || [],
    timeOffSchedules: emp.timeOffSchedules || [],
    assignedServices: emp.assignedServices || [],
  }));

  return (
    <>
      <h2 className="heading">Employee List</h2>

      <ProfileList
        data={employeesFormatted}
        totalItems={employeesResult.total}
        itemsPerPage={itemsPerPage}
      />
    </>
  );
};

export default Page;
