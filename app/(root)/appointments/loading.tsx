import { Skeleton } from "@/components/ui/skeleton";

const AppointmentsLoading = () => {
  return (
    <>
      <h2 className="heading">Appointments</h2>

      <div className="p-4">
        {/* Title "Appointments" placeholder */}
        <div className="flex justify-between mb-4">
          <Skeleton className="h-8 w-1/3" /> {/* Search bar placeholder */}
          <Skeleton className="h-8 w-1/6" /> {/* Group dropdown placeholder */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">
                  <Skeleton className="h-6 w-16" />
                </th>
                <th className="p-2">
                  <Skeleton className="h-6 w-48" />
                </th>
                <th className="p-2">
                  <Skeleton className="h-6 w-16" />
                </th>
                <th className="p-2">
                  <Skeleton className="h-6 w-16" />
                </th>
                <th className="p-2">
                  <Skeleton className="h-6 w-24" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(7)].map((_, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <Skeleton className="h-8 w-24" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-8 w-48" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-8 w-16" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-8 w-16" />
                  </td>
                  <td className="p-2 flex space-x-2">
                    <Skeleton className="h-8 w-4" />
                    <Skeleton className="h-8 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <Skeleton className="h-8 w-1/6" /> {/* Pagination info */}
          <Skeleton className="h-8 w-1/6" /> {/* Add appointment button */}
        </div>
      </div>
    </>
  );
};

export default AppointmentsLoading;
