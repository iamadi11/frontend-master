export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  );
}
