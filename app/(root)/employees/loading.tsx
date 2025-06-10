import ProfileListSkeleton from "@/components/profiles/ProfileListSkeleton";

const EmployeesLoading = () => {
  return (
    <ProfileListSkeleton
      title="Employee List"
      itemCount={5}
      showPagination={true}
    />
  );
};

export default EmployeesLoading;
