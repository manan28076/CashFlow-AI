import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <Loader2 className={cn("animate-spin text-orange-500", className)} size={20} />
  );
};
