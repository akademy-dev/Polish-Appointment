import { Skeleton } from "@/components/ui/skeleton";

const AppointmentFormLoading = () => {
  return (
    <div className="p-4 max-h-[84vh]">
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="flex justify-between mb-6">
        <Skeleton className="h-6 w-1/5" />
        <Skeleton className="h-6 w-1/5" />
      </div>
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-1/6 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-6 w-1/6 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-6 w-1/6 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-6 w-1/6 mb-2" />
          <Skeleton className="h-10 w-1/5" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-1/6 mb-2" />
          <Skeleton className="h-10 w-1/5" />
          <Skeleton className="h-10 w-1/5" />
          <Skeleton className="h-10 w-1/5" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default AppointmentFormLoading;
