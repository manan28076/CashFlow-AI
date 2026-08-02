import { cn } from "../../utils/cn";

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-stone-100", className)}
    />
  );
};
