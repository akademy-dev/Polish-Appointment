import ProfileList from "@/components/profiles/ProfileList";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { CUSTOMERS_QUERY } from "@/sanity/lib/queries";

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

  const params = {
    search: query || null,
    page: currentPage,
    limit: itemsPerPage,
  };

  const { data: customersResult } = await sanityFetch({
    query: CUSTOMERS_QUERY,
    params,
  });

  console.log("customersResult", customersResult);

  return (
    <>
      <h2 className="heading">Customer List</h2>

      <CustomerPageHeader />

      <ProfileList
        data={customersResult.data}
        totalItems={customersResult.total}
        itemsPerPage={itemsPerPage}
      />

      <SanityLive />
    </>
  );
};

export default Page;
