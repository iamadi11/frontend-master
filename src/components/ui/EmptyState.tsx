import { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  children?: ReactNode;
  adminHint?: string;
}

export function EmptyState({
  title,
  description,
  action,
  children,
  adminHint,
}: EmptyStateProps) {
  return (
    <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center bg-gray-50 dark:bg-gray-900/50">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      )}
      {children}
      {action && (
        <Link
          href={action.href}
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </Link>
      )}
      {adminHint && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500 italic">
          {adminHint}
        </p>
      )}
    </div>
  );
}
