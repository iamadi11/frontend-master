import { ReactNode } from "react";

interface ProseProps {
  children: ReactNode;
  className?: string;
}

export function Prose({ children, className = "" }: ProseProps) {
  return (
    <div
      className={`prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-800 prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r ${className}`}
    >
      {children}
    </div>
  );
}
