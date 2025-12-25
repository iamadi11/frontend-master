import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">Topic Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The topic you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/topics"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Browse all topics
      </Link>
    </div>
  );
}
