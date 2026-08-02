import { Tag, Trash2 } from "lucide-react";
import type { Category } from "../../types/category";

interface CategoryListItemProps {
  category: Category;
  onDelete: () => void;
}

export const CategoryListItem = ({ category, onDelete }: CategoryListItemProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Tag size={16} className="text-orange-600" />
        <span className="text-sm font-medium text-stone-800">{category.name}</span>
      </div>
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-stone-500 hover:bg-red-600/15 hover:text-red-600"
        aria-label="Delete category"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
