import { Skeleton } from "@/components/ui/skeleton";

const RootLoading = () => {
  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-1/6" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
              <th className="p-2">
                <Skeleton className="h-6 w-24" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(12)].map((_, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-8 w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RootLoading;
