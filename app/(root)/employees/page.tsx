import ProfileList from "@/components/profiles/ProfileList";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { EMPLOYEES_QUERY } from "@/sanity/lib/queries";

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

  const { data: employeesResult } = await sanityFetch({
    query: EMPLOYEES_QUERY,
    params,
  });

  return (
    <>
      <h2 className="heading">Employee List</h2>

      <ProfileList
        data={employeesResult.data}
        totalItems={employeesResult.total}
        itemsPerPage={itemsPerPage}
      />

      <SanityLive />
    </>
  );
};

export default Page;
