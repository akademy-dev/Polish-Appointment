import ProfileList from "@/components/profiles/ProfileList";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import { getCustomers } from "@/data/customer";

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
    10
  );

  const customersResult = await getCustomers({
    search: query || "",
    page: currentPage,
    limit: itemsPerPage,
  });

  // Transform customers to match expected format
  const customersFormatted = customersResult.data.map((cust) => ({
    _id: cust.id,
    _type: "customer",
    firstName: cust.first_name,
    lastName: cust.last_name,
    phone: cust.phone,
    note: cust.note,
    _createdAt: cust.created_at,
  }));

  return (
    <>
      <h2 className="heading">Customer List</h2>

      <CustomerPageHeader />

      <ProfileList
        data={customersFormatted}
        totalItems={customersResult.total}
        itemsPerPage={itemsPerPage}
      />
    </>
  );
};

export default Page;
