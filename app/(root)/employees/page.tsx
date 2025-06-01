import ProfileList from "@/components/ProfileList";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { EMPLOYEES_QUERY } from "@/sanity/lib/queries";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) => {
  const { query } = await searchParams;
  const params = { search: query || null };

  const { data: employees } = await sanityFetch({
    query: EMPLOYEES_QUERY,
    params,
  });

  console.log(employees);

  return (
    <>
      <h2 className="heading">Employee List</h2>

      <ProfileList data={employees} />

      <SanityLive />
    </>
  );
};

export default Page;
