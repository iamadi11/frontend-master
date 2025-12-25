import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">Resource Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The resource you're looking for doesn't exist.
      </p>
      <Link
        href="/resources"
        className="inline-block px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
      >
        Back to Resources
      </Link>
    </div>
  );
}
