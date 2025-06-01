import ProfileList from "@/components/ProfileList";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { CUSTOMERS_QUERY } from "@/sanity/lib/queries";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) => {
  const { query } = await searchParams;
  const params = { search: query || null };

  const { data: customers } = await sanityFetch({
    query: CUSTOMERS_QUERY,
    params,
  });

  console.log("customers", customers);

  return (
    <>
      <h2 className="heading">Customer List</h2>

      <ProfileList data={customers} />

      <SanityLive />
    </>
  );
};

export default Page;
