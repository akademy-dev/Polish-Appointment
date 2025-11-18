import React from "react";

interface ProfileListSkeletonProps {
  title: string;
  itemCount?: number;
  showPagination?: boolean;
}

const ProfileListSkeleton = ({
  title,
  itemCount = 5,
  showPagination = true,
}: ProfileListSkeletonProps) => {
  // Validate and sanitize itemCount to prevent invalid array length errors
  const safeItemCount = Math.max(
    0,
    Math.min(
      Number.isFinite(itemCount) && itemCount > 0 ? Math.floor(itemCount) : 5,
      100
    )
  );

  return (
    <>
      <h2 className="heading">{title}</h2>

      <section className="space-y-6 max-w-4xl">
        {/* Results Info Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-4">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Profile Cards Skeleton */}
        <ul className="list-container">
          {Array.from({ length: safeItemCount }).map((_, index) => (
            <li key={index} className="flex-between line_card animate-pulse">
              {/* Name skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>

                {/* Role/Badge skeleton */}
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            </li>
          ))}
        </ul>

        {/* Pagination Skeleton */}
        {showPagination && (
          <div className="flex w-full pr-4 sm:justify-end">
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default ProfileListSkeleton;
