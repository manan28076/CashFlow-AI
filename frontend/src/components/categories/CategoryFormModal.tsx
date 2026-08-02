import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { CreateCategoryPayload } from "../../types/category";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload) => Promise<void>;
}

export const CategoryFormModal = ({ isOpen, onClose, onSubmit }: CategoryFormModalProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name });
      setName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="categoryName"
          label="Category Name"
          placeholder="e.g. Groceries"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Add Category
        </Button>
      </form>
    </Modal>
  );
};
