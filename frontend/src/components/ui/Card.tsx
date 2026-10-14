import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-colors duration-200",
        "dark:border-blue-900/40 dark:bg-[#0f172a] dark:text-slate-100 dark:shadow-md dark:shadow-blue-950/20",
        className
      )}
    >
      {children}
    </div>
  );
};
