import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

const variants = {
  primary: "bg-orange-600 hover:bg-orange-500 text-white",
  secondary: "bg-stone-100 hover:bg-stone-200 text-stone-900",
  danger: "bg-red-600 hover:bg-red-500 text-white",
  ghost: "bg-transparent hover:bg-stone-100 text-stone-600",
};

export const Button = ({
  children,
  variant = "primary",
  isLoading,
  disabled,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...rest}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};
