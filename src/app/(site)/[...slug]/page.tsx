import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/content";

export default async function PageBySlug({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const page = await getPageBySlug(slugPath);

  if (!page) {
    notFound();
  }

  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-bold">{page.title}</h1>
      {page.content && (
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-500 dark:text-gray-400 italic">
            Rich text content will be rendered here. For now, this is a
            placeholder.
          </p>
        </div>
      )}
    </article>
  );
}
