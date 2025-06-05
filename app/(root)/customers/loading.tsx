import ProfileListSkeleton from "@/components/profiles/ProfileListSkeleton";

const CustomersLoading = () => {
  return (
    <ProfileListSkeleton
      title="Customer List"
      itemCount={5}
      showPagination={true}
    />
  );
};

export default CustomersLoading;
