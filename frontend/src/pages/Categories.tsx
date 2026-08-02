import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Tag } from "lucide-react";
import { categoryService } from "../services/category.service";
import { CategoryListItem } from "../components/categories/CategoryListItem";
import { CategoryFormModal } from "../components/categories/CategoryFormModal";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import type { Category, CreateCategoryPayload } from "../types/category";

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (payload: CreateCategoryPayload) => {
    try {
      await categoryService.create(payload);
      toast.success("Category added");
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await categoryService.remove(id);
      toast.success("Category deleted");
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Categories</h1>
          <p className="text-sm text-stone-500">Organize your transactions by category</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={32} className="text-stone-600" />}
          title="No categories yet"
          description="Add categories to organize your spending"
          action={<Button onClick={() => setIsModalOpen(true)}>Add Category</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <CategoryListItem
              key={category.id}
              category={category}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
