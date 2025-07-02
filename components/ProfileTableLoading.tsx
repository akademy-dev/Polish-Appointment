import { Skeleton } from "@/components/ui/skeleton";

const ProfileTableLoading = () => {
  return (
    <div className="p-4">
      <div className="flex items-end justify-end mb-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/6 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-1/6 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-1/6 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-1/6 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-1/6 mb-2" />
      </div>
    </div>
  );
};

export default ProfileTableLoading;
