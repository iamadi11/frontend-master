import Link from "next/link";
import { MotionWrapper } from "@/components/motion-wrapper";
import { Home, BookOpen, Settings } from "lucide-react";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              Learning Content
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href="/resources"
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
              >
                <BookOpen className="w-4 h-4" />
                Resources
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            </div>
          </nav>
        </div>
      </header>

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
