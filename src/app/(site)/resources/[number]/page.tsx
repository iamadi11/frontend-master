import { notFound } from "next/navigation";
import { getResourceByNumber } from "@/lib/content";
import { ExternalLink } from "lucide-react";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const resourceNumber = parseInt(number, 10);

  if (isNaN(resourceNumber)) {
    notFound();
  }

  const resource = await getResourceByNumber(resourceNumber);

  if (!resource) {
    notFound();
  }

  return (
    <article className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-4">{resource.title}</h1>
        {resource.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {resource.summary}
          </p>
        )}
      </div>

      {resource.body && (
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-500 dark:text-gray-400 italic">
            Rich text content will be rendered here. For now, this is a
            placeholder.
          </p>
        </div>
      )}

      {resource.references && resource.references.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">References</h2>
          <ul className="space-y-2">
            {resource.references.map((ref: any, index: number) => (
              <li key={index}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {ref.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
