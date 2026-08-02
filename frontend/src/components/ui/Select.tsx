import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = ({ label, children, className, id, ...rest }: SelectProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
};
