import { MotionWrapper } from "@/components/motion-wrapper";
import { SiteHeader } from "@/components/SiteHeader";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Left rail placeholder
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8">
            <MotionWrapper>{children}</MotionWrapper>
          </main>

          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Right rail placeholder
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
