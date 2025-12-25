import { ReactNode } from "react";

interface ProseProps {
  children: ReactNode;
  className?: string;
}

export function Prose({ children, className = "" }: ProseProps) {
  return (
    <div
      className={`prose prose-lg dark:prose-invert max-w-[72ch] ${className}`}
    >
      {children}
    </div>
  );
}
