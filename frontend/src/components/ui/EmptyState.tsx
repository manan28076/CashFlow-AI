import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-200 py-16 text-center">
      {icon}
      <h3 className="text-base font-medium text-stone-800">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-stone-500">{description}</p>
      )}
      {action}
    </div>
  );
};
